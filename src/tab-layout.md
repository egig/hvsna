# Tab Layout

```shell
AppShell (100dvh, flex-column)
├── main (flex:1, overflow hidden)  ← no scroll here
│   └── PageLayout (height: 100%, flex-column)
│       ├── Navbar (56px, flex-shrink: 0)  ← sticky within page
│       └── inner div (flex:1, overflow-y: auto)  ← only this scrolls
└── TabBar (64px)
```
