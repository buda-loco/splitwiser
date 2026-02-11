# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6]:
    - heading "Navigation Test Page" [level=1] [ref=e7]
    - paragraph [ref=e8]: This page is used for automated navigation testing.
    - generic [ref=e9]:
      - paragraph [ref=e10]: Test the bottom navigation by clicking the tabs below.
      - paragraph [ref=e11]: All icons should be SVG elements (Lucide icons).
      - paragraph [ref=e12]: No emojis should be present in the navigation.
  - navigation [ref=e13]:
    - generic [ref=e14]:
      - link "Expenses" [ref=e15] [cursor=pointer]:
        - /url: /
        - generic [ref=e16]:
          - img [ref=e18]
          - generic [ref=e21]: Expenses
      - link "Balances" [ref=e22] [cursor=pointer]:
        - /url: /balances
        - generic [ref=e23]:
          - img [ref=e25]
          - generic [ref=e29]: Balances
      - link "Settlements" [ref=e30] [cursor=pointer]:
        - /url: /settlements
        - generic [ref=e31]:
          - img [ref=e33]
          - generic [ref=e36]: Settlements
      - link "Settings" [ref=e37] [cursor=pointer]:
        - /url: /settings
        - generic [ref=e38]:
          - img [ref=e40]
          - generic [ref=e43]: Settings
  - button "Open Next.js Dev Tools" [ref=e49] [cursor=pointer]:
    - img [ref=e50]
  - alert [ref=e53]
```