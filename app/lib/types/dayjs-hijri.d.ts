declare module 'dayjs-hijri' {
  import { PluginFunc } from 'dayjs';
  
  interface HijriPlugin {
    calendar(s: string): HijriPlugin
    date(): number
    month(): number
    year(): number
  }
  
  declare module 'dayjs' {
    interface Dayjs {
      calendar(s: string): HijriPlugin
    }
  }
  
  const plugin: PluginFunc;
  export = plugin;
}
