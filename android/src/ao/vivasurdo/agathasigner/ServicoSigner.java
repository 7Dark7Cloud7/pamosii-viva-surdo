package ao.vivasurdo.agathasigner;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.service.quicksettings.TileService;
import android.webkit.RenderProcessGoneDetail;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Janela flutuante com o mesmo app empacotado, em modo emb=1.
 * O único motor de sinais é o JavaScript do fork. O texto é entregue em memória,
 * sem URL, captura de ecrã, AccessibilityService ou ponte JavaScript nativa.
 */
public class ServicoSigner extends Service {

    public static final String ACCAO_INICIAR = "ao.vivasurdo.agathasigner.INICIAR";
    public static final String ACCAO_PARAR = "ao.vivasurdo.agathasigner.PARAR";
    public static final String EXTRA_TEXTO = "ao.vivasurdo.agathasigner.TEXTO";
    public static final String ACCAO_ESTADO = "ao.vivasurdo.agathasigner.ESTADO";

    private static final String CANAL = "painel";
    private static final int NOTIFICACAO = 42;
    private static final int MAX_TEXTO = 6000;

    private static volatile boolean activo = false;

    public static boolean activo() {
        return activo;
    }

    private WindowManager janela;
    private LinearLayout raiz;
    private WebView vista;
    private TextView aviso;
    private LinearLayout faixa;
    private WindowManager.LayoutParams params;

    private boolean paginaPronta = false;
    private boolean carregamentoFalhou = false;
    private boolean injectando = false;
    private boolean largo = false;
    private int geracao;
    private int tecladoAltura;
    private String textoPendente = null;

    @Override
    public void onCreate() {
        super.onCreate();
        janela = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        criarCanal();
    }

    @Override
    public int onStartCommand(Intent inten, int flags, int inicioId) {
        String accao = inten == null ? ACCAO_INICIAR : inten.getAction();
        if (accao == null) accao = ACCAO_INICIAR;

        if (ACCAO_PARAR.equals(accao)) {
            apagarJanela();
            stopSelf();
            return START_NOT_STICKY;
        }

        /* sem a autorizacao da pessoa o Android recusa a janela: parar em vez de
           deixar um servico fantasma com uma notificacao mentirosa */
        if (!Settings.canDrawOverlays(this)) {
            apagarJanela();
            stopSelf();
            return START_NOT_STICKY;
        }

        arrancarNaFrente();
        try {
            if (raiz == null) criarJanela();
        } catch (WindowManager.BadTokenException | SecurityException e) {
            apagarJanela();
            stopSelf();
            return START_NOT_STICKY;
        }
        entregarTexto(inten == null ? null : inten.getStringExtra(EXTRA_TEXTO));
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        apagarJanela();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent inten) {
        return null;
    }

    /* ---------------------------------------------------------------- o painel */

    private String enderecoPainel() { return SiteLocal.PAINEL; }

    private boolean paginaAutorizada(String url) { return SiteLocal.paginaAutorizada(url); }

    @Override public void onConfigurationChanged(Configuration configuration) {
        super.onConfigurationChanged(configuration);
        medir();
    }

    private void criarJanela() {
        raiz = new LinearLayout(this);
        raiz.setOrientation(LinearLayout.VERTICAL);
        raiz.setClipToOutline(false);

        GradientDrawable casca = new GradientDrawable();
        casca.setColor(getColor(R.color.papel));
        casca.setStroke(dp(2), getColor(R.color.linha));
        casca.setCornerRadius(dp(18));
        raiz.setBackground(casca);
        raiz.setPadding(dp(4), dp(4), dp(4), dp(6));

        raiz.addView(barraDeArrastar());
        raiz.addView(campoDeAviso());

        vista = new WebView(this);
        configurarVista(vista);
        raiz.addView(vista, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        params = new WindowManager.LayoutParams();
        params.type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        params.format = PixelFormat.TRANSLUCENT;
        /* FLAG_HARDWARE_ACCELERATED: sem ela, a WebView dentro de uma janela de
           servico pode sair preta em alguns aparelhos. */
        params.flags = WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
                | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN;
        params.gravity = Gravity.TOP | Gravity.LEFT;
        params.softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
        if (Build.VERSION.SDK_INT >= 30) params.setFitInsetsTypes(0);
        if (Build.VERSION.SDK_INT >= 28) params.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER;
        params.x = dp(8);
        params.y = dp(64);
        raiz.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                int height = insets.getInsets(android.view.WindowInsets.Type.ime()).bottom;
                if (height != tecladoAltura) { tecladoAltura = height; medir(); }
            }
            return insets;
        });
        aplicarFoco(false);
        medir();

        janela.addView(raiz, params);
        activo = true;
        notificarEstado();
        paginaPronta = false;
        vista.loadUrl(enderecoPainel());
    }

    private Rect limites() {
        int width;
        int height;
        int left = 0, top = 0, right = 0, bottom = 0;
        if (Build.VERSION.SDK_INT >= 30) {
            android.view.WindowMetrics metrics = janela.getCurrentWindowMetrics();
            width = metrics.getBounds().width();
            height = metrics.getBounds().height();
            android.graphics.Insets safe = metrics.getWindowInsets().getInsetsIgnoringVisibility(
                    android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
            left = safe.left; top = safe.top; right = safe.right; bottom = safe.bottom;
        } else {
            android.util.DisplayMetrics metrics = new android.util.DisplayMetrics();
            janela.getDefaultDisplay().getRealMetrics(metrics);
            width = metrics.widthPixels; height = metrics.heightPixels;
            int status = getResources().getIdentifier("status_bar_height", "dimen", "android");
            int nav = getResources().getIdentifier("navigation_bar_height", "dimen", "android");
            top = status == 0 ? dp(24) : getResources().getDimensionPixelSize(status);
            // Conservative clearance also protects side navigation in landscape on API 26–29.
            right = bottom = nav == 0 ? dp(48) : getResources().getDimensionPixelSize(nav);
            if (Build.VERSION.SDK_INT >= 28 && raiz != null && raiz.getRootWindowInsets() != null
                    && raiz.getRootWindowInsets().getDisplayCutout() != null) {
                android.view.DisplayCutout cutout = raiz.getRootWindowInsets().getDisplayCutout();
                left = Math.max(left, cutout.getSafeInsetLeft());
                top = Math.max(top, cutout.getSafeInsetTop());
                right = Math.max(right, cutout.getSafeInsetRight());
                bottom = Math.max(bottom, cutout.getSafeInsetBottom());
            }
        }
        bottom = Math.max(bottom, tecladoAltura);
        return new Rect(left + dp(8), top + dp(8), Math.max(left + dp(9), width - right - dp(8)),
                Math.max(top + dp(9), height - bottom - dp(8)));
    }

    /** Recalcula e limita a janela inteira, incluindo todos os controlos. */
    private void medir() {
        if (params == null) return;
        Rect safe = limites();
        params.width = largo ? safe.width() : Math.min(dp(430), safe.width());
        params.height = largo ? safe.height() : Math.min(safe.height(), Math.max(dp(360), (int) (safe.height() * 0.62f)));
        limitarPosicao();
        actualizarJanela();
    }

    private void limitarPosicao() {
        if (params == null) return;
        Rect safe = limites();
        params.x = Math.max(safe.left, Math.min(params.x, safe.right - params.width));
        params.y = Math.max(safe.top, Math.min(params.y, safe.bottom - params.height));
    }

    private void actualizarJanela() {
        if (raiz != null && raiz.isAttachedToWindow() && params != null) {
            try { janela.updateViewLayout(raiz, params); }
            catch (IllegalArgumentException | SecurityException e) { apagarJanela(); stopSelf(); }
        }
    }

    /**
     * Uma janela focavel rouba o teclado ao app por baixo. Por omissao a janela do
     * Signer NAO e focavel: a pessoa continua a escrever no Chrome ou no WhatsApp e
     * ve os sinais por cima. So ganha foco com o botao «Escrever».
     */
    private void aplicarFoco(boolean focavel) {
        if (params == null) return;
        if (focavel) {
            params.flags &= ~WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        } else {
            params.flags |= WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        }
        if (raiz != null && raiz.isAttachedToWindow()) {
            try {
                janela.updateViewLayout(raiz, params);
            } catch (IllegalArgumentException | SecurityException e) {
                apagarJanela();
                stopSelf();
            }
        }
    }

    private LinearLayout barraDeArrastar() {
        LinearLayout barra = new LinearLayout(this);
        barra.setOrientation(LinearLayout.VERTICAL);
        barra.setGravity(Gravity.CENTER_VERTICAL);
        barra.setPadding(dp(4), dp(4), dp(4), dp(4));
        GradientDrawable fundo = new GradientDrawable();
        fundo.setColor(getColor(R.color.primaria_clara));
        fundo.setCornerRadius(dp(14));
        barra.setBackground(fundo);

        Button rotulo = miniBotao(getString(R.string.arrastrar));
        rotulo.setContentDescription(getString(R.string.mover_ajuda));
        rotulo.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        barra.addView(rotulo, new LinearLayout.LayoutParams(-1, -2));
        rotulo.setOnClickListener(v -> mostrarPosicoes(rotulo));
        LinearLayout controlos = new LinearLayout(this);
        controlos.setGravity(Gravity.CENTER_VERTICAL);
        barra.addView(controlos);

        Button escrever = miniBotao(getString(R.string.botao_escrever));
        escrever.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                boolean focavel = (params.flags & WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE) != 0;
                aplicarFoco(focavel);
                escrever.setText(focavel ? R.string.botao_concluir : R.string.botao_escrever);
                if (vista != null) {
                    if (focavel) vista.requestFocus();
                    else {
                        android.view.inputmethod.InputMethodManager teclado =
                                (android.view.inputmethod.InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
                        teclado.hideSoftInputFromWindow(vista.getWindowToken(), 0);
                        vista.clearFocus();
                    }
                }
            }
        });
        controlos.addView(escrever, pesoBotao());

        Button tamanho = miniBotao(getString(R.string.tamanho));
        tamanho.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                largo = !largo;
                tamanho.setText(largo ? R.string.reduzir : R.string.tamanho);
                medir();
            }
        });
        controlos.addView(tamanho, pesoBotao());

        Button fechar = miniBotao(getString(R.string.fechar));
        fechar.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                Intent inten = new Intent(ServicoSigner.this, ServicoSigner.class);
                inten.setAction(ACCAO_PARAR);
                Principal.comeceServico(ServicoSigner.this, inten);
            }
        });
        controlos.addView(fechar, pesoBotao());

        // Only the labelled handle drags. A tap/assistive click offers discrete movement.
        rotulo.setOnTouchListener(new View.OnTouchListener() {
            private float x0, y0;
            private int px0, py0;
            private boolean moveu;
            private final int limiar = android.view.ViewConfiguration.get(ServicoSigner.this).getScaledTouchSlop();
            @Override public boolean onTouch(View view, MotionEvent event) {
                if (params == null) return false;
                int action = event.getActionMasked();
                if (action == MotionEvent.ACTION_DOWN) {
                    x0 = event.getRawX(); y0 = event.getRawY();
                    px0 = params.x; py0 = params.y; moveu = false;
                    view.setPressed(true);
                    return true;
                }
                if (action == MotionEvent.ACTION_MOVE) {
                    float dx = event.getRawX() - x0, dy = event.getRawY() - y0;
                    if (Math.abs(dx) > limiar || Math.abs(dy) > limiar) moveu = true;
                    if (moveu) {
                        params.x = px0 + (int) dx; params.y = py0 + (int) dy;
                        limitarPosicao(); actualizarJanela();
                    }
                    return true;
                }
                if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL) {
                    view.setPressed(false);
                    if (action == MotionEvent.ACTION_UP && !moveu) view.performClick();
                    return true;
                }
                return true;
            }
        });
        return barra;
    }

    private LinearLayout.LayoutParams pesoBotao() {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, -2, 1);
        p.setMargins(dp(4), dp(4), dp(4), 0);
        return p;
    }

    private void mostrarPosicoes(View anchor) {
        android.widget.PopupMenu menu = new android.widget.PopupMenu(this, anchor);
        int[] labels = { R.string.mover_cima, R.string.mover_baixo, R.string.mover_esquerda,
                R.string.mover_direita, R.string.centrar };
        for (int i = 0; i < labels.length; i++) menu.getMenu().add(0, i, i, labels[i]);
        menu.setOnMenuItemClickListener(item -> {
            if (params == null) return true;
            switch (item.getItemId()) {
                case 0: params.y -= dp(48); break;
                case 1: params.y += dp(48); break;
                case 2: params.x -= dp(48); break;
                case 3: params.x += dp(48); break;
                default:
                    Rect safe = limites();
                    params.x = safe.left + (safe.width() - params.width) / 2;
                    params.y = safe.top + (safe.height() - params.height) / 2;
            }
            limitarPosicao(); actualizarJanela();
            return true;
        });
        menu.show();
    }

    private Button miniBotao(String texto) {
        Button b = new Button(this);
        b.setText(texto);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
        b.setTextColor(getColor(R.color.primaria_forte));
        b.setBackgroundTintList(ColorStateList.valueOf(getColor(R.color.papel)));
        b.setPadding(dp(4), dp(6), dp(4), dp(6));
        b.setMinWidth(dp(48));
        b.setMinimumWidth(dp(48));
        b.setMinHeight(dp(48));
        b.setMinimumHeight(dp(48));
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        p.leftMargin = dp(6);
        b.setLayoutParams(p);
        return b;
    }

    private LinearLayout campoDeAviso() {
        faixa = new LinearLayout(this);
        faixa.setOrientation(LinearLayout.HORIZONTAL);
        faixa.setGravity(Gravity.CENTER_VERTICAL);
        faixa.setBackgroundColor(getColor(R.color.creme));
        faixa.setPadding(dp(12), dp(8), dp(8), dp(8));

        aviso = new TextView(this);
        aviso.setText(getString(R.string.a_carregar));
        aviso.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13.5f);
        aviso.setTextColor(getColor(R.color.tinta));
        faixa.addView(aviso, new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        Button tentar = miniBotao(getString(R.string.recarregar));
        tentar.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                paginaPronta = false;
                aviso.setText(getString(R.string.a_carregar));
                if (vista != null) vista.loadUrl(enderecoPainel());
            }
        });
        faixa.addView(tentar);

        faixa.setVisibility(View.GONE);
        return faixa;
    }

    private void configurarVista(WebView v) {
        SiteLocal.configurar(v);
        v.setWebViewClient(new SiteLocal.Cliente(this) {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                geracao++;
                injectando = false;
                paginaPronta = false;
                carregamentoFalhou = false;
                faixa.setVisibility(View.VISIBLE);
                aviso.setText(R.string.a_carregar);
                if (!paginaAutorizada(url)) {
                    view.stopLoading();
                    carregamentoFalhou = true;
                    mostrarAviso(true);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (carregamentoFalhou || !paginaAutorizada(url)) return;
                final int page = geracao;
                view.evaluateJavascript(SiteLocal.PRONTA, new ValueCallback<String>() {
                    @Override public void onReceiveValue(String valor) {
                        if (view != vista || page != geracao || carregamentoFalhou || !paginaAutorizada(view.getUrl())) return;
                        paginaPronta = "true".equals(valor);
                        mostrarAviso(!paginaPronta);
                        if (paginaPronta) injectar();
                    }
                });
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest requisicao,
                                        WebResourceError erro) {
                if (requisicao.isForMainFrame() || SiteLocal.recursoEssencial(requisicao.getUrl())) {
                    paginaPronta = false;
                    carregamentoFalhou = true;
                    mostrarAviso(true);
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest requisicao,
                                            WebResourceResponse resposta) {
                if (requisicao.isForMainFrame() || SiteLocal.recursoEssencial(requisicao.getUrl())) {
                    paginaPronta = false;
                    carregamentoFalhou = true;
                    mostrarAviso(true);
                }
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detalhe) {
                if (raiz != null) raiz.removeView(view);
                view.destroy();
                vista = null;
                apagarJanela();
                stopSelf();
                return true;
            }
        });

        v.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest pedido) {
                /* este painel nao grava som nem imagem: recusar tudo, sempre */
                pedido.deny();
            }
        });
    }

    private void mostrarAviso(boolean visivel) {
        if (faixa == null || aviso == null) return;
        if (visivel) {
            aviso.setText(getString(R.string.sem_rede));
            faixa.setVisibility(View.VISIBLE);
        } else {
            faixa.setVisibility(View.GONE);
        }
    }

    /* ---------------------------------------------------------------- o texto */

    private void entregarTexto(String texto) {
        if (TextUtils.isEmpty(texto)) return;
        String limpo = texto.replace("\u0000", "").trim();
        if (limpo.length() > MAX_TEXTO) limpo = limpo.substring(0, MAX_TEXTO);
        if (limpo.length() < 2) {
            Toast.makeText(this, getString(R.string.sem_texto), Toast.LENGTH_LONG).show();
            return;
        }
        textoPendente = limpo;
        injectar();
    }

    /** Entrega o texto dentro da pagina, sem o por no endereco. */
    private void injectar() {
        if (vista == null || !paginaPronta || textoPendente == null || injectando
                || !paginaAutorizada(vista.getUrl())) return;
        final String texto = textoPendente;
        final WebView destino = vista;
        final int page = geracao;
        injectando = true;
        SiteLocal.entregar(destino, texto, new ValueCallback<String>() {
            @Override public void onReceiveValue(String valor) {
                if (destino != vista || page != geracao) return;
                injectando = false;
                if ("\"ok\"".equals(valor)) {
                    if (texto.equals(textoPendente)) textoPendente = null;
                    else injectar();
                } else {
                    paginaPronta = false;
                    mostrarAviso(true);
                    aviso.setText(R.string.entrega_falhou);
                }
            }
        });
    }

    /* ---------------------------------------------------------------- ciclo de vida */

    private void arrancarNaFrente() {
        Intent abreApp = new Intent(this, Principal.class);
        abreApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent paraAbrir = PendingIntent.getActivity(this, 0, abreApp, flags);

        Intent para = new Intent(this, ServicoSigner.class);
        para.setAction(ACCAO_PARAR);
        PendingIntent paraFechar = PendingIntent.getService(this, 1, para, flags);

        Notification notificacao = new Notification.Builder(this, CANAL)
                .setContentTitle(getString(R.string.notifier_titulo))
                .setContentText(getString(R.string.notifier_texto))
                .setSmallIcon(R.drawable.ic_sinal)
                .setContentIntent(paraAbrir)
                .setOngoing(true)
                .addAction(new Notification.Action.Builder(
                        Icon.createWithResource(this, R.drawable.ic_sinal),
                        getString(R.string.notifier_fechar), paraFechar).build())
                .build();
        startForeground(NOTIFICACAO, notificacao);
    }

    private void notificarEstado() {
        sendBroadcast(new Intent(ACCAO_ESTADO).setPackage(getPackageName()));
        TileService.requestListeningState(this, new ComponentName(this, PainelRapid.class));
    }

    private void criarCanal() {
        NotificationManager gestora = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (gestora == null) return;
        NotificationChannel canal = new NotificationChannel(CANAL,
                getString(R.string.notifier_canal), NotificationManager.IMPORTANCE_LOW);
        canal.setDescription(getString(R.string.notifier_texto));
        canal.setShowBadge(false);
        gestora.createNotificationChannel(canal);
    }

    private void apagarJanela() {
        activo = false;
        paginaPronta = false;
        injectando = false;
        textoPendente = null;
        notificarEstado();
        if (vista != null) {
            vista.stopLoading();
            if (raiz != null) raiz.removeView(vista);
            vista.destroy();
            vista = null;
        }
        if (raiz != null && janela != null) {
            try {
                janela.removeView(raiz);
            } catch (Exception e) {
                /* nunca chegou a ser adicionada */
            }
        }
        raiz = null;
        aviso = null;
        faixa = null;
        params = null;
    }

    private int dp(int valor) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, valor,
                getResources().getDisplayMetrics());
    }
}
