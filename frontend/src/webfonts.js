// Web-only font loading: alias our RN family names to locally-bundled woff2 files
// (served from /public/fonts) so the web build needs NO network / CDN — offline ready.
// (expo-font's web loader renders blank glyphs under Metro web, so we inject CSS instead.)
import { Platform } from 'react-native';

const ARCHIVO = '/fonts/archivo.woff2';
const PUBLIC = '/fonts/publicsans.woff2';
const MONO = '/fonts/jetbrainsmono.woff2';

const face = (family, weight, url) =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(${url}) format('woff2');}`;

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const css = [
    face('Archivo_600SemiBold', 600, ARCHIVO),
    face('Archivo_700Bold', 700, ARCHIVO),
    face('Archivo_800ExtraBold', 800, ARCHIVO),
    face('PublicSans_400Regular', 400, PUBLIC),
    face('PublicSans_500Medium', 500, PUBLIC),
    face('PublicSans_600SemiBold', 600, PUBLIC),
    face('JetBrainsMono_500Medium', 500, MONO),
    face('JetBrainsMono_700Bold', 700, MONO),
    'html,body,#root{height:100%}',
  ].join('\n');
  const style = document.createElement('style');
  style.setAttribute('data-pedidrip-fonts', '');
  style.textContent = css;
  document.head.appendChild(style);
}
