declare module 'sri-toolbox' {
  interface SriOptions {
    algorithms: string[];
  }

  interface SriToolbox {
    generate: (options: SriOptions, content: string) => string;
  }

  const sriToolbox: SriToolbox;
  export default sriToolbox;
}