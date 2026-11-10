import handler from '../lib/online-cv.cjs';
import bridge from '../lib/web-bridge.cjs';
export default {fetch(request){return bridge(request,handler)}};
