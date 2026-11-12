package ao.vivasurdo.agathasigner;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/** O mesmo app de duas páginas do fork, com apenas duas acções nativas. */
public class Principal extends Activity {
    public static final String ACCAO_PAINEL = "ao.vivasurdo.agathasigner.PAINEL";
    private static final int AUTORIZAR = 10;
    private static final int FICHEIRO = 11;
    private WebView vista;
    private LinearLayout raiz;
    private LinearLayout faixa;
    private TextView estado;
    private Button botaoPainel;
    private boolean pronta;
    private boolean falhou;
    private boolean injectando;
    private boolean emFrente;
    private boolean autorizarPendente;
    private boolean fecharAposPainel;
    private int geracao;
    private long ultimoGesto;
    private String textoPendente;
    private ValueCallback<Uri[]> escolher;
    private Uri seleccionado;
    private android.window.OnBackInvokedCallback voltarCallback;

    private static final class Memoria {
        String texto;
        boolean autorizar;
        boolean fechar;
    }

    private final BroadcastReceiver estadoReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) { mostrarEstado(); }
    };

    @Override protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        montarInterface();
        Memoria memory = (Memoria) getLastNonConfigurationInstance();
        if (memory != null) {
            textoPendente = memory.texto;
            autorizarPendente = memory.autorizar;
            fecharAposPainel = memory.fechar;
        }
        String url = saved == null ? null : saved.getString("pagina");
        vista.loadUrl(SiteLocal.paginaAutorizada(url) ? url : SiteLocal.PRINCIPAL);
        if (saved == null) tratarInten(getIntent());
        if (Build.VERSION.SDK_INT >= 33) {
            voltarCallback = this::voltar;
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, voltarCallback);
        }
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        tratarInten(intent);
    }

    @Override protected void onStart() {
        super.onStart();
        IntentFilter filter = new IntentFilter(ServicoSigner.ACCAO_ESTADO);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(estadoReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        else registerReceiver(estadoReceiver, filter);
    }

    @Override protected void onStop() {
        unregisterReceiver(estadoReceiver);
        super.onStop();
    }

    @Override protected void onResume() {
        super.onResume();
        emFrente = true;
        if (vista != null) vista.onResume();
        mostrarEstado();
        injectar();
    }

    @Override protected void onPause() {
        emFrente = false;
        if (vista != null) vista.onPause();
        // pauseTimers() is global and would also freeze the active overlay.
        super.onPause();
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        if (vista != null && SiteLocal.paginaAutorizada(vista.getUrl())) out.putString("pagina", vista.getUrl());
        // Pending text and selected URI are never saved to a Bundle or preferences.
        super.onSaveInstanceState(out);
    }

    @Override public Object onRetainNonConfigurationInstance() {
        Memoria memory = new Memoria();
        memory.texto = textoPendente;
        memory.autorizar = autorizarPendente;
        memory.fechar = fecharAposPainel;
        return memory;
    }

    @Override protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= 33 && voltarCallback != null) {
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(voltarCallback);
        }
        cancelarEscolha();
        libertarFicheiro();
        textoPendente = null;
        geracao++;
        if (vista != null) {
            raiz.removeView(vista);
            vista.stopLoading();
            vista.destroy();
            vista = null;
        }
        super.onDestroy();
    }

    @Override public void onBackPressed() { voltar(); }

    private void voltar() {
        if (vista != null && vista.canGoBack()) vista.goBack();
        else finish();
    }

    private void tratarInten(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (ACCAO_PAINEL.equals(action)) {
            intent.setAction(null);
            accaoPainel(true);
            return;
        }
        boolean share = Intent.ACTION_SEND.equals(action);
        boolean process = Intent.ACTION_PROCESS_TEXT.equals(action);
        if (!share && !process) return;
        CharSequence incoming = intent.getCharSequenceExtra(process ? Intent.EXTRA_PROCESS_TEXT : Intent.EXTRA_TEXT);
        if (share && (incoming == null || incoming.length() == 0)) incoming = intent.getCharSequenceExtra(Intent.EXTRA_SUBJECT);
        textoPendente = SiteLocal.limparTexto(incoming);
        intent.setAction(null);
        intent.removeExtra(Intent.EXTRA_TEXT);
        intent.removeExtra(Intent.EXTRA_SUBJECT);
        intent.removeExtra(Intent.EXTRA_PROCESS_TEXT);
        intent.setClipData(null);
        if (textoPendente == null) { aviso(R.string.sem_texto); return; }
        if (Settings.canDrawOverlays(this) && abrirPainel(textoPendente)) {
            textoPendente = null;
            finish();
        } else {
            // A share never opens permission settings. The complete app works without an overlay.
            aviso(R.string.texto_no_app);
            injectar();
        }
    }

    private void accaoPainel(boolean fechar) {
        if (ServicoSigner.activo()) {
            stopService(new Intent(this, ServicoSigner.class));
            if (fechar) finish();
        } else if (Settings.canDrawOverlays(this)) {
            if (abrirPainel(textoPendente)) {
                textoPendente = null;
                if (fechar) finish();
            }
        } else {
            new AlertDialog.Builder(this).setTitle(R.string.janela_flutuante)
                    .setMessage(R.string.pedir_sobreposicao)
                    .setNegativeButton(R.string.continuar_no_app, (dialog, which) -> injectar())
                    .setPositiveButton(R.string.botao_autorizar, (dialog, which) -> {
                        autorizarPendente = true;
                        fecharAposPainel = fechar;
                        Intent settings = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                Uri.parse("package:" + getPackageName()));
                        try { startActivityForResult(settings, AUTORIZAR); }
                        catch (RuntimeException e) {
                            autorizarPendente = false;
                            aviso(R.string.sem_definicoes);
                        }
                    }).show();
        }
        mostrarEstado();
    }

    private boolean abrirPainel(String text) {
        if (!Settings.canDrawOverlays(this)) return false;
        Intent intent = new Intent(this, ServicoSigner.class).setAction(ServicoSigner.ACCAO_INICIAR);
        if (text != null) intent.putExtra(ServicoSigner.EXTRA_TEXTO, text);
        try { comeceServico(this, intent); return true; }
        catch (RuntimeException e) { aviso(R.string.painel_falhou); return false; }
    }

    static void comeceServico(Context context, Intent intent) {
        if (ServicoSigner.ACCAO_PARAR.equals(intent.getAction())) context.stopService(intent);
        else context.startForegroundService(intent);
    }

    private void mostrarEstado() {
        if (botaoPainel == null) return;
        botaoPainel.setText(ServicoSigner.activo() ? R.string.fechar_janela : R.string.janela_flutuante);
    }

    private void opcoes() {
        String overlay = getString(Settings.canDrawOverlays(this) ? R.string.permissao_sim : R.string.permissao_nao);
        new AlertDialog.Builder(this).setTitle(R.string.opcoes)
                .setMessage(overlay + "\n\n" + getString(R.string.privacidade) + "\n\n" + getString(R.string.honestidade))
                .setPositiveButton(R.string.concluido, null)
                .setNeutralButton(R.string.recarregar_app, (dialog, which) -> recarregar()).show();
    }

    private void montarInterface() {
        raiz = new LinearLayout(this);
        raiz.setOrientation(LinearLayout.VERTICAL);
        raiz.setBackgroundColor(getColor(R.color.papel));
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        else getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        raiz.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return WindowInsets.CONSUMED;
            }
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        faixa = new LinearLayout(this);
        faixa.setGravity(android.view.Gravity.CENTER_VERTICAL);
        faixa.setPadding(dp(12), dp(4), dp(8), dp(4));
        faixa.setBackgroundColor(getColor(R.color.creme));
        estado = new TextView(this);
        estado.setTextColor(getColor(R.color.tinta));
        estado.setTextSize(14);
        estado.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        faixa.addView(estado, new LinearLayout.LayoutParams(0, -2, 1));
        Button retry = botao(getString(R.string.recarregar));
        retry.setOnClickListener(v -> recarregar());
        faixa.addView(retry);
        raiz.addView(faixa);
        criarVista();
        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setPadding(dp(8), dp(4), dp(8), dp(4));
        toolbar.setBackgroundColor(getColor(R.color.creme));
        botaoPainel = botao(getString(R.string.janela_flutuante));
        botaoPainel.setOnClickListener(v -> accaoPainel(false));
        toolbar.addView(botaoPainel, new LinearLayout.LayoutParams(0, -2, 1));
        Button options = botao(getString(R.string.opcoes));
        options.setOnClickListener(v -> opcoes());
        LinearLayout.LayoutParams optionsParams = new LinearLayout.LayoutParams(-2, -2);
        optionsParams.leftMargin = dp(8);
        toolbar.addView(options, optionsParams);
        raiz.addView(toolbar);
        setContentView(raiz);
        raiz.requestApplyInsets();
    }

    private void criarVista() {
        vista = new WebView(this);
        SiteLocal.configurar(vista);
        vista.setOnTouchListener((v, event) -> {
            if (event.getActionMasked() == MotionEvent.ACTION_UP) ultimoGesto = SystemClock.uptimeMillis();
            return false;
        });
        vista.setOnKeyListener((v, key, event) -> {
            if (event.getAction() == KeyEvent.ACTION_UP && (key == KeyEvent.KEYCODE_ENTER
                    || key == KeyEvent.KEYCODE_DPAD_CENTER || key == KeyEvent.KEYCODE_SPACE)) ultimoGesto = SystemClock.uptimeMillis();
            return false;
        });
        vista.setWebViewClient(new SiteLocal.Cliente(this) {
            @Override public void onPageStarted(WebView view, String url, Bitmap icon) {
                geracao++;
                injectando = false;
                pronta = false;
                falhou = false;
                cancelarEscolha();
                libertarFicheiro();
                mensagem(R.string.a_carregar);
                if (!SiteLocal.paginaAutorizada(url)) { view.stopLoading(); erro(); }
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (view != vista || falhou || !SiteLocal.paginaAutorizada(url)) return;
                final int page = geracao;
                view.evaluateJavascript(SiteLocal.PRONTA, value -> {
                    if (view != vista || page != geracao || falhou || !SiteLocal.paginaAutorizada(view.getUrl())) return;
                    pronta = "true".equals(value);
                    if (pronta) { faixa.setVisibility(View.GONE); injectar(); }
                    else erro();
                });
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame() || SiteLocal.recursoEssencial(request.getUrl())) erro();
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() || SiteLocal.recursoEssencial(request.getUrl())) erro();
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                cancelarEscolha();
                libertarFicheiro();
                raiz.removeView(view);
                view.destroy();
                vista = null;
                geracao++;
                injectando = false;
                erro();
                return true;
            }
        });
        vista.setWebChromeClient(new SiteLocal.Chrome() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                cancelarEscolha();
                if (view != vista || !emFrente || !pronta || !SiteLocal.paginaAutorizada(view.getUrl())
                        || params.getMode() != FileChooserParams.MODE_OPEN || params.isCaptureEnabled()) {
                    callback.onReceiveValue(null);
                    return true;
                }
                escolher = callback;
                boolean gesto = ultimoGesto > 0 && SystemClock.uptimeMillis() - ultimoGesto < 2000;
                ultimoGesto = 0;
                // userActivation also covers assistive technology clicks without a touch event.
                view.evaluateJavascript("!!(navigator.userActivation && navigator.userActivation.isActive)", value -> {
                    if (escolher != callback) return;
                    if ((!gesto && !"true".equals(value)) || view != vista || !emFrente
                            || !SiteLocal.paginaAutorizada(view.getUrl())) { cancelarEscolha(); return; }
                    abrirDocumento(params);
                });
                return true;
            }
        });
        raiz.addView(vista, 1, new LinearLayout.LayoutParams(-1, 0, 1));
    }

    private void abrirDocumento(android.webkit.WebChromeClient.FileChooserParams params) {
        boolean video = false;
        boolean texto = false;
        for (String accept : params.getAcceptTypes()) {
            for (String type : accept.toLowerCase(java.util.Locale.ROOT).split(",")) {
                type = type.trim();
                if ("video/*".equals(type)) video = true;
                else if (".txt".equals(type) || ".srt".equals(type) || ".vtt".equals(type)
                        || ".pdf".equals(type) || "text/plain".equals(type) || "application/pdf".equals(type)) texto = true;
                else if (!type.isEmpty()) { cancelarEscolha(); return; }
            }
        }
        if (video == texto) { cancelarEscolha(); return; }
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(video ? "video/*" : "*/*");
        if (texto) intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] {
                "text/*", "application/pdf", "application/x-subrip", "application/octet-stream" });
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        // No persistable grant, no camera intent, no storage permission, single selected URI only.
        try { startActivityForResult(intent, FICHEIRO); }
        catch (RuntimeException e) { cancelarEscolha(); aviso(R.string.sem_seletor); }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == AUTORIZAR) {
            boolean wanted = autorizarPendente;
            autorizarPendente = false;
            if (wanted && Settings.canDrawOverlays(this) && abrirPainel(textoPendente)) {
                textoPendente = null;
                if (fecharAposPainel) finish();
            } else injectar();
            fecharAposPainel = false;
            mostrarEstado();
        } else if (request == FICHEIRO) {
            ValueCallback<Uri[]> callback = escolher;
            escolher = null;
            Uri uri = data == null ? null : data.getData();
            if (callback == null) return;
            if (result == RESULT_OK && uri != null && "content".equals(uri.getScheme())
                    && vista != null && SiteLocal.paginaAutorizada(vista.getUrl())) {
                libertarFicheiro();
                seleccionado = uri;
                callback.onReceiveValue(new Uri[] { uri });
            } else callback.onReceiveValue(null);
        }
    }

    private void cancelarEscolha() {
        if (escolher != null) {
            ValueCallback<Uri[]> callback = escolher;
            escolher = null;
            callback.onReceiveValue(null);
        }
    }

    private void libertarFicheiro() {
        if (seleccionado == null) return;
        try { revokeUriPermission(seleccionado, Intent.FLAG_GRANT_READ_URI_PERMISSION); }
        catch (RuntimeException ignored) { /* The system may already have revoked the temporary grant. */ }
        seleccionado = null;
    }

    private void injectar() {
        if (!emFrente || !pronta || falhou || injectando || textoPendente == null
                || vista == null || !SiteLocal.paginaAutorizada(vista.getUrl())) return;
        String text = textoPendente;
        WebView target = vista;
        int page = geracao;
        injectando = true;
        SiteLocal.entregar(target, text, value -> {
            if (target != vista || page != geracao) return;
            injectando = false;
            if ("\"ok\"".equals(value)) {
                if (text.equals(textoPendente)) textoPendente = null;
                else injectar();
            } else mensagem(R.string.entrega_falhou);
        });
    }

    private void recarregar() {
        if (vista == null) criarVista();
        String url = vista.getUrl();
        vista.loadUrl(SiteLocal.paginaAutorizada(url) ? url : SiteLocal.PRINCIPAL);
    }

    private void erro() { pronta = false; falhou = true; mensagem(R.string.app_indisponivel); }
    private void mensagem(int text) { estado.setText(text); faixa.setVisibility(View.VISIBLE); }
    private void aviso(int text) { Toast.makeText(this, text, Toast.LENGTH_LONG).show(); }

    private Button botao(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setAllCaps(false);
        button.setTextSize(14);
        button.setMinHeight(dp(48));
        button.setMinimumHeight(dp(48));
        button.setTextColor(getColor(R.color.sobre_primaria));
        button.setBackgroundTintList(ColorStateList.valueOf(getColor(R.color.primaria)));
        return button;
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
}
