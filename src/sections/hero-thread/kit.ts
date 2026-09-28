import { DRACOLoader } from "three-stdlib";

/** Static pure-JS worker: preserves worker-src 'self' and script-src 'self'. */
export function kitDecoder() {
  const decoder = new DRACOLoader();
  decoder.setWorkerLimit(1);
  // Three exposes this initialization hook internally. Override only worker setup;
  // the upstream task scheduler, transfer buffers, and decoder remain unchanged.
  Object.assign(decoder, {
    workerSourceURL: "/models/draco-worker.js",
    _initDecoder: () => Promise.resolve(),
  });
  return decoder;
}
