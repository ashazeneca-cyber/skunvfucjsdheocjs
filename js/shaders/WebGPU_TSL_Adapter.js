/**
 * RAPSONYX WebGPU / TSL Capability Adapter
 * - Probes navigator.gpu adapter safely without crashing older browsers
 * - Keeps WebGL2 as primary stable backend while exposing TSL readiness flags
 */

export class WebGPU_TSL_Adapter {
  static async probeCapabilities() {
    const supported = typeof navigator !== 'undefined' && Boolean(navigator.gpu);
    if (!supported) {
      return { webgpu: false, adapterName: 'WebGL2 Fallback', tslReady: false };
    }
    try {
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) return { webgpu: false, adapterName: 'WebGL2 Fallback', tslReady: false };
      const info = adapter.info || {};
      return {
        webgpu: true,
        adapterName: info.description || info.architecture || 'WebGPU Hardware Adapter',
        tslReady: true
      };
    } catch (_) {
      return { webgpu: false, adapterName: 'WebGL2 Fallback', tslReady: false };
    }
  }
}
