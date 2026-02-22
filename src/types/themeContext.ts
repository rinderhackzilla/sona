export enum Theme {
  Dark = 'dark',
  Black = 'black',
  OneDark = 'one-dark',
  EmberDusk = 'ember-dusk',
  VerdantPulse = 'verdant-pulse',
  MarmaladeBeaver = 'marmalade-beaver',
  NoctisLilac = 'noctis-lilac',
  MonokaiPro = 'monokai-pro',
  GithubDark = 'github-dark',
  CatppuccinMocha = 'catppuccin-mocha',
  NuclearDark = 'nuclear-dark',
  Achiever = 'achiever',
  Dracula = 'dracula',
  Discord = 'discord',
  TinaciousDesign = 'tinacious-design',
  VueDark = 'vue-dark',
}

export interface IThemeContext {
  theme: Theme
  setTheme: (theme: Theme) => void
}
