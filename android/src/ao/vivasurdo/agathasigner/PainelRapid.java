package ao.vivasurdo.agathasigner;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/**
 * Azulejo para o painel de ajustes rapidos.
 *
 * Nao faz nada de mágico: abrir uma janela por cima de outra app so pode ser feito
 * a partir de um app em primeiro plano (regra do Android 12 em diante). Entao o
 * azulejo lanca o Principal com a accao «painel», que liga ou desliga a janela e
 * fecha-se logo — a pessoa volta ao Chrome de onde estava.
 */
public class PainelRapid extends TileService {

    @Override
    public void onStartListening() {
        Tile t = getQsTile();
        if (t == null) return;
        t.setLabel(getString(R.string.nome_app));
        int subtitulo;
        if (!Settings.canDrawOverlays(this)) {
            t.setState(Tile.STATE_INACTIVE);
            subtitulo = R.string.tile_sem_autorizacao;
        } else if (ServicoSigner.activo()) {
            t.setState(Tile.STATE_ACTIVE);
            subtitulo = R.string.tile_a_mostrar;
        } else {
            t.setState(Tile.STATE_INACTIVE);
            subtitulo = R.string.tile_ligar;
        }
        if (Build.VERSION.SDK_INT >= 29) t.setSubtitle(getString(subtitulo));
        t.updateTile();
    }

    @Override
    public void onClick() {
        Intent inten = new Intent(this, Principal.class);
        inten.setAction(Principal.ACCAO_PAINEL);
        inten.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (Build.VERSION.SDK_INT >= 34) {
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
            startActivityAndCollapse(PendingIntent.getActivity(this, 7, inten, flags));
        } else {
            startActivityAndCollapse(inten);
        }
    }

    /** Chamado pelo Principal quando a pessoa toca no azulejo: liga ou desliga. */
    static void alternar(Context contexto) {
        Intent inten = new Intent(contexto, ServicoSigner.class);
        inten.setAction(ServicoSigner.activo()
                ? ServicoSigner.ACCAO_PARAR : ServicoSigner.ACCAO_INICIAR);
        Principal.comeceServico(contexto, inten);
    }
}
