// Web-only font loading: alias our RN family names to Google variable-font woff2.
// (expo-font's web loader renders blank glyphs under Metro web, so we inject CSS instead.)
import { Platform } from 'react-native';

const ARCHIVO = 'https://fonts.gstatic.com/s/archivo/v25/k3kPo8UDI-1M0wlSV9XAw6lQkqWY8Q82sLydOxI.woff2';
const PUBLIC = 'https://fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNGfJ4.woff2';
const MONO = 'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2';

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
