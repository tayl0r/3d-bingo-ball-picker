/// <reference types="vite/client" />

declare module "zzfx" {
  export function zzfx(...params: (number | undefined)[]): AudioBufferSourceNode;
}
