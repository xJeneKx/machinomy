declare module 'prompt' {
  namespace Prompt {
    function start (): void
    function get <A> (names: string[], callback: (err: any, result: A) => void): void
  }

  export = Prompt
}
