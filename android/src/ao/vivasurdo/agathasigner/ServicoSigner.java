package ao.vivasurdo.agathasigner;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.Icon;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
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

import org.json.JSONObject;

/**
 * A janela flutuante.
 *
 * Servico em primeiro plano com uma WebView em TYPE_APPLICATION_OVERLAY: fica por
 * cima do ecra inicial, do Chrome, do WhatsApp — de qualquer app com texto. O
 * conteudo e exactamente o painel do site do Pamosii em modo widget (?emb=1): nao
 * ha glossario nem sinais dentro deste APK.
 *
 * O texto que a pessoa partilha NAO vai no endereco nem para o servidor: e injectado
 * na pagina ja aberta, aqui no telemovel, por window.sgUsarTextoExterno(). Se algum
 * dia o site deixar de expor essa funcao, o painel diz isso — nunca envia o texto
 * por outro canal a escondidas.
 */
public class ServicoSigner extends Service {

    public static final String ACCAO_INICIAR = "ao.vivasurdo.agathasigner.INICIAR";
    public static final String ACCAO_PARAR = "ao.vivasurdo.agathasigner.PARAR";
    public static final String EXTRA_TEXTO = "ao.vivasurdo.agathasigner.TEXTO";

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
    private boolean largo = false;
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
        if (raiz == null) criarJanela();
        entregarTexto(inten == null ? null : inten.getStringExtra(EXTRA_TEXTO));
        return START_STICKY;
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

    private String enderecoPainel() {
        SharedPreferences prefs = getSharedPreferences(Principal.PREFERENCIAS, Context.MODE_PRIVATE);
        String base = prefs.getString(Principal.CHAVE_BASE, Principal.BASE_PUBLICADA);
        if (!Principal.enderecoPermitido(base)) base = Principal.BASE_PUBLICADA;
        if (!base.endsWith("/")) base = base + "/";
        return base + "?emb=1";
    }

    private void criarJanela() {
        raiz = new LinearLayout(this);
        raiz.setOrientation(LinearLayout.VERTICAL);
        raiz.setClipToOutline(false);

        GradientDrawable casca = new GradientDrawable();
        casca.setColor(getColor(R.color.papel));
        casca.setStroke(dp(2), getColor(R.color.teal_fundo));
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
        params.flags = WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED;
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = dp(8);
        params.y = dp(64);
        aplicarFoco(false);
        medir();

        janela.addView(raiz, params);
        activo = true;
        paginaPronta = false;
        vista.loadUrl(enderecoPainel());
    }

    /** Tamanho da janela. So mexe em params: nunca em raiz.setLayoutParams. */
    private void medir() {
        if (params == null) return;
        int larguraEcra = getResources().getDisplayMetrics().widthPixels;
        int alturaEcra = getResources().getDisplayMetrics().heightPixels;
        params.width = largo
                ? larguraEcra - dp(16)
                : Math.min(dp(430), (int) (larguraEcra * 0.92f));
        params.height = largo
                ? alturaEcra - dp(120)
                : (int) (alturaEcra * 0.62f);
        if (raiz != null && raiz.isAttachedToWindow()) {
            try {
                janela.updateViewLayout(raiz, params);
            } catch (Exception e) {
                /* a janela ja nao la esta: o proximo onStartCommand reconstroi-a */
            }
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
            } catch (Exception e) {
                /* idem */
            }
        }
    }

    private LinearLayout barraDeArrastar() {
        LinearLayout barra = new LinearLayout(this);
        barra.setOrientation(LinearLayout.HORIZONTAL);
        barra.setGravity(Gravity.CENTER_VERTICAL);
        barra.setPadding(dp(12), dp(8), dp(6), dp(8));
        GradientDrawable fundo = new GradientDrawable();
        fundo.setColor(getColor(R.color.teal_fundo));
        fundo.setCornerRadius(dp(14));
        barra.setBackground(fundo);

        TextView rotulo = new TextView(this);
        rotulo.setText(getString(R.string.arrastrar));
        rotulo.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f);
        rotulo.setTextColor(getColor(R.color.ambar));
        barra.addView(rotulo, new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        Button escrever = miniBotao(getString(R.string.botao_escrever));
        escrever.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                aplicarFoco(true);
                if (vista != null) vista.requestFocus();
            }
        });
        barra.addView(escrever);

        Button tamanho = miniBotao(getString(R.string.tamanho));
        tamanho.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                largo = !largo;
                medir();
            }
        });
        barra.addView(tamanho);

        Button fechar = miniBotao(getString(R.string.fechar));
        fechar.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                Intent inten = new Intent(ServicoSigner.this, ServicoSigner.class);
                inten.setAction(ACCAO_PARAR);
                Principal.comeceServico(ServicoSigner.this, inten);
            }
        });
        barra.addView(fechar);

        /* arrastar so pela barra: assim se carrega nos sinais sem mover nada */
        barra.setOnTouchListener(new View.OnTouchListener() {
            private float x0;
            private float y0;
            private int px0;
            private int py0;

            @Override
            public boolean onTouch(View v, MotionEvent ev) {
                int accao = ev.getActionMasked();
                if (accao == MotionEvent.ACTION_DOWN) {
                    x0 = ev.getRawX();
                    y0 = ev.getRawY();
                    px0 = params.x;
                    py0 = params.y;
                    return true;
                }
                if (accao == MotionEvent.ACTION_MOVE) {
                    params.x = px0 + (int) (ev.getRawX() - x0);
                    params.y = py0 + (int) (ev.getRawY() - y0);
                    try {
                        janela.updateViewLayout(raiz, params);
                    } catch (Exception e) {
                        /* janela entretanto removida */
                    }
                    return true;
                }
                return false;
            }
        });
        return barra;
    }

    private Button miniBotao(String texto) {
        Button b = new Button(this);
        b.setText(texto);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
        b.setTextColor(getColor(R.color.teal_fundo));
        b.setBackgroundColor(getColor(R.color.ambar));
        b.setPadding(dp(12), dp(6), dp(12), dp(6));
        b.setMinWidth(0);
        b.setMinHeight(0);
        b.setStateListAnimator(null);
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
        WebSettings s = v.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        /* nada de ficheiros nem de conteudo local: o painel so fala com o site */
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        s.setGeolocationEnabled(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setTextZoom(100);
        v.setBackgroundColor(getColor(R.color.papel));

        v.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                paginaPronta = true;
                mostrarAviso(false);
                injectar();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest requisicao,
                                        WebResourceError erro) {
                if (requisicao.isForMainFrame()) mostrarAviso(true);
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest requisicao,
                                            WebResourceResponse resposta) {
                if (requisicao.isForMainFrame()) mostrarAviso(true);
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
        if (vista == null || !paginaPronta || textoPendente == null) return;
        final String texto = textoPendente;
        textoPendente = null;
        String js = "(function(t){"
                + "if (typeof window.sgUsarTextoExterno === 'function') {"
                + "  return window.sgUsarTextoExterno(t, 'partilhado no telemovel') ? 'ok' : 'vazio';"
                + "} return 'sem';"
                + "})(" + JSONObject.quote(texto) + ")";
        vista.evaluateJavascript(js, new ValueCallback<String>() {
            @Override public void onReceiveValue(String valor) {
                if (valor == null || valor.indexOf("sem") < 0) return;
                Toast.makeText(ServicoSigner.this,
                        "O site ja nao recebe texto por dentro do painel: actualiza o site do Pamosii.",
                        Toast.LENGTH_LONG).show();
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
        activo = true;
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
        textoPendente = null;
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
