# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e5]:
    - heading "Welcome to Splitwiser" [level=1] [ref=e6]
    - paragraph [ref=e7]: Enter your email to receive a magic link
    - generic [ref=e8]:
      - generic [ref=e9]: Email address
      - textbox "Email address" [ref=e10]:
        - /placeholder: you@example.com
      - button "Send Magic Link" [ref=e11] [cursor=pointer]
  - navigation [ref=e12]:
    - generic [ref=e13]:
      - link "Expenses" [ref=e14] [cursor=pointer]:
        - /url: /
        - generic [ref=e15]:
          - img [ref=e17]
          - generic [ref=e20]: Expenses
      - link "Balances" [ref=e21] [cursor=pointer]:
        - /url: /balances
        - generic [active] [ref=e22]:
          - img [ref=e24]
          - generic [ref=e28]: Balances
      - link "Settlements" [ref=e29] [cursor=pointer]:
        - /url: /settlements
        - generic [ref=e30]:
          - img [ref=e32]
          - generic [ref=e35]: Settlements
      - link "Settings" [ref=e36] [cursor=pointer]:
        - /url: /settings
        - generic [ref=e37]:
          - img [ref=e39]
          - generic [ref=e42]: Settings
  - button "Open Next.js Dev Tools" [ref=e48] [cursor=pointer]:
    - img [ref=e49]
  - alert [ref=e52]: Welcome to Splitwiser
```