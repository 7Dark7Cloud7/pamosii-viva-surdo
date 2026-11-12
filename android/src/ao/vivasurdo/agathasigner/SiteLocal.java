package ao.vivasurdo.agathasigner;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/** Uma origem virtual, exclusivamente de assets do APK, para ambas as superfícies. */
final class SiteLocal {
    static final String ORIGEM = "https://appassets.androidplatform.net";
    static final String PRINCIPAL = ORIGEM + "/app/index.html?native=1";
    static final String PAINEL = PRINCIPAL + "&emb=1";
    static final String PRONTA = "document.readyState !== 'loading'"
            + " && typeof window.sgUsarTextoExterno === 'function'";
    private static final Set<String> FICHEIROS = new HashSet<>(Arrays.asList(
            "/app/index.html", "/app/styles.css", "/app/dados.js", "/app/maos.js",
            "/app/app.js", "/app/theme.js", "/app/manifest.webmanifest",
            "/app/assets/vivasurdo-logo-icon-512.png",
            "/app/assets/vivasurdo-logo-maskable-512.png"));
    private static final String CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; "
            + "style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; "
            + "media-src blob:; connect-src 'self' blob:; manifest-src 'self'; "
            + "worker-src 'none'; frame-src 'none'; object-src 'none'; "
            + "base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

    private SiteLocal() { }

    private static boolean origem(Uri uri) {
        return uri != null && "https".equals(uri.getScheme())
                && "appassets.androidplatform.net".equals(uri.getEncodedAuthority())
                && uri.getUserInfo() == null && uri.getPort() == -1;
    }

    static boolean paginaAutorizada(String url) {
        if (url == null) return false;
        Uri uri = Uri.parse(url);
        return origem(uri) && "/app/index.html".equals(uri.getEncodedPath())
                && ("native=1".equals(uri.getEncodedQuery())
                    || "native=1&emb=1".equals(uri.getEncodedQuery()));
    }

    private static String caminho(Uri uri) {
        if (!origem(uri)) return null;
        String path = uri.getEncodedPath();
        // Sem descodificação: rejeita %, barras invertidas, dot-segments e nomes desconhecidos.
        return path != null && FICHEIROS.contains(path) ? path.substring(1) : null;
    }

    static boolean recursoEssencial(Uri uri) {
        String path = caminho(uri);
        return path != null && (path.endsWith(".js") || path.endsWith(".css")
                || path.endsWith("index.html"));
    }

    private static Map<String, String> cabecalhos() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Security-Policy", CSP);
        headers.put("X-Content-Type-Options", "nosniff");
        headers.put("Referrer-Policy", "no-referrer");
        headers.put("Cache-Control", "no-store");
        headers.put("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        return headers;
    }

    private static WebResourceResponse recusado() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                cabecalhos(), new ByteArrayInputStream(new byte[0]));
    }

    private static WebResourceResponse recurso(Context context, Uri uri, String method) {
        String path = caminho(uri);
        if (!"GET".equals(method) || path == null) return recusado();
        String mime = path.endsWith(".html") ? "text/html"
                : path.endsWith(".css") ? "text/css"
                : path.endsWith(".js") ? "application/javascript"
                : path.endsWith(".png") ? "image/png" : "application/manifest+json";
        try {
            return new WebResourceResponse(mime, path.endsWith(".png") ? null : "UTF-8",
                    200, "OK", cabecalhos(), context.getAssets().open(path));
        } catch (IOException e) {
            return recusado();
        }
    }

    static void configurar(WebView view) {
        WebSettings s = view.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        // Não usamos setBlockNetworkLoads(true): em algumas versões bloqueia a própria
        // navegação para appassets antes de shouldInterceptRequest. A garantia aqui é
        // outra, mais forte: o APK não declara INTERNET, o CSP fecha tudo a 'self' e
        // shouldInterceptRequest devolve 404 a qualquer caminho fora da lista.
        // Multiple windows + onCreateWindow=false refuses target=_blank popups.
        s.setSupportMultipleWindows(true);
        s.setGeolocationEnabled(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setSaveFormData(false);
        s.setSafeBrowsingEnabled(true);
        view.setSaveEnabled(false);
        view.setBackgroundColor(view.getContext().getColor(R.color.papel));
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false);
        view.setDownloadListener((url, agent, disposition, mime, length) ->
                Toast.makeText(view.getContext(), R.string.download_recusado, Toast.LENGTH_LONG).show());
        // SW cannot replace the packaged source, even on a WebView with old persisted state.
        ServiceWorkerController sw = ServiceWorkerController.getInstance();
        sw.getServiceWorkerWebSettings().setBlockNetworkLoads(true);
        sw.getServiceWorkerWebSettings().setAllowContentAccess(false);
        sw.getServiceWorkerWebSettings().setAllowFileAccess(false);
        sw.setServiceWorkerClient(new ServiceWorkerClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                return recusado();
            }
        });
    }

    static class Chrome extends WebChromeClient {
        @Override public void onPermissionRequest(PermissionRequest request) { request.deny(); }
        @Override public void onGeolocationPermissionsShowPrompt(String origin,
                GeolocationPermissions.Callback callback) { callback.invoke(origin, false, false); }
        @Override public boolean onCreateWindow(WebView view, boolean dialog, boolean gesture,
                android.os.Message result) { return false; }
    }

    static class Cliente extends WebViewClient {
        private final Context context;
        Cliente(Context context) { this.context = context.getApplicationContext(); }

        @Override public WebResourceResponse shouldInterceptRequest(WebView view,
                WebResourceRequest request) {
            if (request.isForMainFrame() && !paginaAutorizada(request.getUrl().toString())) {
                return recusado();
            }
            return recurso(context, request.getUrl(), request.getMethod());
        }

        @Override public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            return recurso(context, Uri.parse(url), "GET");
        }

        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (request.isForMainFrame() && "GET".equals(request.getMethod())
                    && paginaAutorizada(request.getUrl().toString())) return false;
            Uri uri = request.getUrl();
            String scheme = uri.getScheme();
            // Only actual taps on external HTTP(S) links may leave the sandbox.
            if (request.isForMainFrame() && request.hasGesture() && !request.isRedirect()
                    && paginaAutorizada(view.getUrl()) && uri.getUserInfo() == null
                    && uri.getHost() != null && !"appassets.androidplatform.net".equals(uri.getHost())
                    && ("https".equals(scheme) || "http".equals(scheme))) {
                Intent browser = new Intent(Intent.ACTION_VIEW, uri);
                browser.addCategory(Intent.CATEGORY_BROWSABLE);
                browser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try { context.startActivity(browser); }
                catch (RuntimeException e) {
                    Toast.makeText(context, R.string.sem_browser, Toast.LENGTH_LONG).show();
                }
            }
            return true;
        }

        @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
            // The legacy callback cannot establish a gesture; never launch an external app.
            return !paginaAutorizada(url);
        }
    }

    static String limparTexto(CharSequence source) {
        if (source == null) return null;
        StringBuilder out = new StringBuilder(Math.min(source.length(), 6000));
        for (int i = 0; i < source.length() && out.length() < 6000; i++) {
            char c = source.charAt(i);
            if ((c < 32 && c != '\n' && c != '\r' && c != '\t') || c == 127) continue;
            if (Character.isHighSurrogate(c)) {
                if (i + 1 < source.length() && Character.isLowSurrogate(source.charAt(i + 1))
                        && out.length() < 5999) out.append(c).append(source.charAt(++i));
            } else if (!Character.isLowSurrogate(c)) out.append(c);
        }
        String text = out.toString().trim();
        return text.length() < 2 ? null : text;
    }

    static void entregar(WebView view, String text, ValueCallback<String> callback) {
        if (!paginaAutorizada(view.getUrl())) { callback.onReceiveValue("\"origem\""); return; }
        String json = JSONObject.quote(text).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029");
        String js = "(function(t){if(location.origin!==" + JSONObject.quote(ORIGEM)
                + "||location.pathname!=='/app/index.html'"
                + "||(location.search!=='?native=1'&&location.search!=='?native=1&emb=1'))return 'origem';"
                + "if(document.readyState==='loading'||typeof window.sgUsarTextoExterno!=='function')return 'sem';"
                + "try{return window.sgUsarTextoExterno(t,'partilhado no telemóvel')?'ok':'vazio';}"
                + "catch(e){return 'sem';}})(" + json + ")";
        view.evaluateJavascript(js, callback);
    }
}
