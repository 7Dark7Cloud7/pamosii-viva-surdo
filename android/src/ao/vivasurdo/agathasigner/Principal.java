package ao.vivasurdo.agathasigner;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Ecran d'acceito do overlay.
 *
 * Nao ha nada aqui alem de tres coisas: dizer se a pessoa ja autorizou a janela
 * flutuante, ligar/desligar o painel, e escolher o endereco do site. O painel em si
 * e o do Pamosii, aberto por cima de qualquer app (ecra inicial, Chrome, WhatsApp).
 */
public class Principal extends Activity {

    public static final String PREFERENCIAS = "agatha-signer";
    public static final String CHAVE_BASE = "base";
    public static final String BASE_PUBLICADA = "https://7dark7cloud7.github.io/pamosii-viva-surdo/";
    /** O azulejo dos ajustes rapidos usa esta accao: ligar sem ecran pelo meio. */
    public static final String ACCAO_PAINEL = "ao.vivasurdo.agathasigner.PAINEL";

    private TextView estado;
    private EditText campoBase;
    private Button botaoPainel;
    private Button botaoAutorizar;

    @Override
    protected void onCreate(Bundle pacote) {
        super.onCreate(pacote);
        /* vindo do azulejo: liga ou desliga a janela e sai logo — a pessoa estava a
           ler qualquer coisa noutro app e é lá que tem de voltar a ficar */
        if (ACCAO_PAINEL.equals(getIntent().getAction())) {
            if (!Settings.canDrawOverlays(this)) {
                pedirAutorizacao();
            } else {
                PainelRapid.alternar(this);
            }
            finish();
            return;
        }
        montarInterface();
        tratarInten(getIntent());
    }

    @Override
    protected void onNewIntent(Intent inten) {
        setIntent(inten);
        if (ACCAO_PAINEL.equals(inten.getAction())) {
            if (!Settings.canDrawOverlays(this)) {
                pedirAutorizacao();
            } else {
                PainelRapid.alternar(this);
            }
            finish();
            return;
        }
        tratarInten(inten);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (estado == null) return;
        mostrarEstado();
    }

    /**
     * Quando o app e chamado a partir de outro (Partilhar / Assinalar texto) nao
     * abrimos uma pantalla nova por cima do que a pessoa esta a ler: mandamos o
     * texto direito para a janela flutuante e deixamo-la onde estava.
     */
    private void tratarInten(Intent inten) {
        if (inten == null) return;
        String accao = inten.getAction();
        boolean partilha = Intent.ACTION_SEND.equals(accao);
        boolean seleccao = "android.intent.action.PROCESS_TEXT".equals(accao);
        if (!partilha && !seleccao) return;
        /* limpar a accao: sem isto, voltar a este app reenviava o texto velho */
        inten.setAction(null);
        String texto = seleccao
                ? inten.getStringExtra("android.intent.extra.PROCESS_TEXT")
                : inten.getStringExtra(Intent.EXTRA_TEXT);
        if (partilha && TextUtils.isEmpty(texto)) {
            texto = inten.getStringExtra(Intent.EXTRA_SUBJECT);
        }
        if (TextUtils.isEmpty(texto)) {
            aviso(R.string.sem_texto);
            return;
        }
        abrirPainel(texto);
    }

    private void abrirPainel(String texto) {
        if (!Settings.canDrawOverlays(this)) {
            aviso(R.string.sem_permissao);
            pedirAutorizacao();
            return;
        }
        Intent inten = new Intent(this, ServicoSigner.class);
        inten.setAction(ServicoSigner.ACCAO_INICIAR);
        inten.putExtra(ServicoSigner.EXTRA_TEXTO, texto);
        comeceServico(inten);
    }

    /** startForegroundService e obrigatorio a partir do API 26; aqui o min e 26. */
    static void comeceServico(Context contexto, Intent inten) {
        contexto.startForegroundService(inten);
    }

    private void comeceServico(Intent inten) {
        comeceServico(this, inten);
    }

    private void mostrarEstado() {
        boolean autorizado = Settings.canDrawOverlays(this);
        boolean aMover = ServicoSigner.activo();
        if (!autorizado) {
            estado.setText(R.string.sem_permissao);
            botaoAutorizar.setVisibility(View.VISIBLE);
            botaoPainel.setEnabled(false);
            botaoPainel.setText(R.string.botao_mostrar);
        } else {
            estado.setText(aMover ? R.string.a_mostrar : R.string.a_parar);
            botaoAutorizar.setVisibility(View.GONE);
            botaoPainel.setEnabled(true);
            botaoPainel.setText(aMover ? R.string.botao_esconder : R.string.botao_mostrar);
        }
    }

    private void pedirAutorizacao() {
        /* o Android so deixa pedir isto ao sistema, nunca por nos */
        Intent inten = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName()));
        try {
            startActivity(inten);
        } catch (Exception e) {
            aviso("Este Android nao abriu a pantalla de autorizacao: procura «Mostrar sobre outras apps» nas Definicoes do app.");
        }
    }

    private void guardarBase() {
        String endereco = campoBase.getText().toString().trim();
        if (!enderecoPermitido(endereco)) {
            aviso("Só endereços https://, ou http://127.0.0.1 / http://localhost para ensaios na mesma máquina. Assim o texto nunca sai do telemóvel por um canal aberto.");
            return;
        }
        preferencias().edit().putString(CHAVE_BASE, endereco).apply();
        aviso("Endereço guardado.");
    }

    /**
     * https sempre; http só em localhost, para a equipa poder ensaiar com o servidor
     * local do site. É o espelho do que o res/xml/rede.xml permite ao sistema.
     */
    static boolean enderecoPermitido(String url) {
        if (url == null || url.length() == 0) return false;
        if (url.startsWith("https://")) return true;
        return url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost");
    }

    private SharedPreferences preferencias() {
        return getSharedPreferences(PREFERENCIAS, Context.MODE_PRIVATE);
    }

    private String baseGuardada() {
        String guardado = preferencias().getString(CHAVE_BASE, BASE_PUBLICADA);
        return TextUtils.isEmpty(guardado) ? BASE_PUBLICADA : guardado;
    }

    private void aviso(int recurso) {
        aviso(getString(recurso));
    }

    private void aviso(String texto) {
        Toast.makeText(this, texto, Toast.LENGTH_LONG).show();
    }

    /* ------------------------------------------------------------------ interface */

    private void montarInterface() {
        ScrollView rolagem = new ScrollView(this);
        rolagem.setFillViewport(true);

        LinearLayout coluna = new LinearLayout(this);
        coluna.setOrientation(LinearLayout.VERTICAL);
        int margem = dp(20);
        coluna.setPadding(margem, margem, margem, margem);
        rolagem.addView(coluna, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        coluna.addView(tv(getString(R.string.titulo), 21, true));
        coluna.addView(tv(getString(R.string.explicacao), 15, false));

        estado = tv(getString(R.string.a_parar), 16, true);
        estado.setTextColor(getColor(R.color.teal_fundo));
        GradientDrawable caixa = new GradientDrawable();
        caixa.setColor(getColor(R.color.creme));
        caixa.setStroke(dp(2), getColor(R.color.linha));
        caixa.setCornerRadius(dp(14));
        estado.setBackground(caixa);
        estado.setPadding(dp(14), dp(12), dp(14), dp(12));
        LinearLayout.LayoutParams estadoParams = cheios();
        estadoParams.topMargin = dp(14);
        estadoParams.bottomMargin = dp(14);
        coluna.addView(estado, estadoParams);

        botaoAutorizar = botao(getString(R.string.botao_autorizar));
        botaoAutorizar.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { pedirAutorizacao(); }
        });
        coluna.addView(botaoAutorizar);

        botaoPainel = botao(getString(R.string.botao_mostrar));
        botaoPainel.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                if (ServicoSigner.activo()) {
                    Intent inten = new Intent(Principal.this, ServicoSigner.class);
                    inten.setAction(ServicoSigner.ACCAO_PARAR);
                    comeceServico(inten);
                } else {
                    abrirPainel(null);
                }
                mostrarEstado();
            }
        });
        coluna.addView(botaoPainel);

        coluna.addView(tv(getString(R.string.honestidade), 14, false));

        TextView rotuloBase = tv(getString(R.string.rotulo_base), 14, true);
        rotuloBase.setPadding(0, dp(18), 0, dp(4));
        coluna.addView(rotuloBase);

        campoBase = new EditText(this);
        campoBase.setInputType(android.text.InputType.TYPE_CLASS_TEXT
                | android.text.InputType.TYPE_TEXT_VARIATION_URI);
        campoBase.setText(baseGuardada());
        campoBase.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        coluna.addView(campoBase, cheios());

        coluna.addView(tv(getString(R.string.ajuda_base), 13, false));

        Button guardar = botao(getString(R.string.botao_guardar));
        guardar.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { guardarBase(); }
        });
        coluna.addView(guardar);

        TextView creditos = tv(getString(R.string.creditos), 13, false);
        creditos.setPadding(0, dp(22), 0, dp(6));
        creditos.setTextColor(getColor(R.color.tinta));
        coluna.addView(creditos);
        coluna.addView(tv(getString(R.string.privacidade), 13, false));

        setContentView(rolagem);
    }

    private Button botao(String texto) {
        Button b = new Button(this);
        b.setText(texto);
        b.setAllCaps(false);
        b.setTextColor(getColor(R.color.papel));
        b.setBackgroundColor(getColor(R.color.teal));
        b.setMinHeight(dp(52));
        LinearLayout.LayoutParams params = cheios();
        params.topMargin = dp(8);
        b.setLayoutParams(params);
        return b;
    }

    private TextView tv(String texto, int tamanhoSp, boolean forte) {
        TextView t = new TextView(this);
        t.setText(texto);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, tamanhoSp);
        t.setTextColor(getColor(R.color.tinta));
        if (forte) t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
        t.setPadding(0, dp(6), 0, dp(6));
        t.setLayoutParams(cheios());
        return t;
    }

    private LinearLayout.LayoutParams cheios() {
        return new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    }

    private int dp(int valor) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, valor,
                getResources().getDisplayMetrics());
    }
}
