# TreeInBio design system

TreeInBio copies the Creatosaurus app (`app-creatosaurus`) pattern for pattern. The only difference is the theme colour: Creatosaurus blue `#0078FF` becomes green `#16A34A`. Everything here was read from the Creatosaurus source: `common/layout`, `common/components`, `modules/analytics`, `modules/inbox-v2` and `modules/social-accounts`.

All values are written as arbitrary Tailwind px values (`text-[12px]`, `rounded-[10px]`), the same way Creatosaurus writes them.

## 1. Colour

| Role | Creatosaurus | TreeInBio |
|---|---|---|
| Canvas behind the cards | `#E6F2FF` (per module) | `#E8F7EE` |
| Primary (buttons, links, checks, unread, first chart series) | `#0078FF` | `#16A34A` |
| Primary hover | `#006CE6` | `#15803D` |
| Primary soft fill (icon-button hover, sort chip) | `#0078FF1A`, `#EBF3FF` | `#16A34A1A`, `#E8F7EE` |
| Selected row in a dropdown | `#E6F2FF80` | `#E8F7EE80` |

The neutral and status colours are unchanged:

- Text: `#000`, `#1A1A1A`, `#333333` (body), `#404040`, `#808080` (muted, placeholder), `#AAAAAA` (meta).
- Borders: `#DCDCDC`/`#DCDCDCCC` (always 0.5px), `#C4C4C4` (input pill, hover), `#C4C4C466` (table grid), `#F0F0F0` (row dividers), `#EBEBEB` (modal dividers).
- Surfaces: white cards, `#FAFAFA` (inputs, selected rows), `#F8F8F9` (soft fills, hover, round buttons), `#F8F8F9BF` (hover on white pills), `#F0F0F0` (incoming bubble, media fallback).
- Status:
  - Up / success `#16A34A`, down `#DC2626`.
  - Danger `#FF4359` (hover `#E63C50`, disabled `#FFA1AC`, soft `#FF43591A`).
  - Warning banner `#FFF8E1` / `#FFE082` / `#92400E`.

The brand colour is never used for an active nav item, an active tab or a card border. Active states are neutral:

- Nav, account and thread rows: `bg-[#F8F8F9]` or `bg-[#FAFAFA]` with `border-[0.5px] border-[#DCDCDC]`.
- Active pill tab: `border-[#000]`.

## 2. Type

- Font: Poppins 300–600; 700 is not used.
- Sizes:
  - 16px semibold: page title.
  - 14px semibold: card, chart and modal titles, KPI value.
  - 14px: nav items and form labels (labels are `font-medium`).
  - 12px: body, inputs, buttons, table cells.
  - 11px: tooltips, deltas.
  - 10px: header pills, captions, helper text.
  - 9px: timestamps and micro labels.
- Inputs use `font-light`.

## 3. Layout

```
canvas (#E8F7EE)
├─ LeftBar     w-[260px] (60 collapsed)  bg-white rounded-[10px] py-[15px] ml-[10px] mt-[10px] h-[calc(100vh-20px)]
└─ page card   w-full bg-white mt-[10px] mx-[10px] p-[15px] rounded-[10px] relative overflow-hidden h-[calc(100vh-20px)]
     ├─ ActionHeader   h-[24px]: title (16px semibold) · right: 23px pills, gap-x-[10px] text-[10px]
     ├─ toolbar        mt-[15px] pb-[15px] border-b-[0.5px] border-[#DCDCDC]: pill tabs left, pill controls right
     └─ scroller       mt-[15px] overflow-y-scroll customScrollBar (pr-[6px] mr-[3px])
```

- There is no separate top bar; everything sits inside the page card.
- Master–detail pages (Inbox, Analytics) add a 260px list card beside the page card. Each is its own floating card, 10px apart.
- Cards and panels have no shadow. Shadows appear only on menus, popovers and tooltips.

## 4. Components

### LeftBar
- Logo row: `flex items-center h-[24px] ml-[9px]`, logo plus wordmark `text-[16px] font-semibold ml-[7px]`.
- Workspace trigger: `relative h-[34px] flex items-center mt-[10px] rounded-[5px] justify-between px-[7px] mx-[13px] border-[0.5px] border-[#DCDCDCCC] bg-[#FAFAFA]` (border `#404040` when open).
- Create button: `flex items-center h-[34px] mb-[10px] px-[7px] bg-[#000000] rounded-[5px]`, white plus icon (20px, stroke 2) and label `text-[#fff] ml-[10px]`.
- Nav item:
  - Base: `flex items-center h-[34px] min-h-[34px] mb-[10px] px-[7px] rounded-[5px] hover:bg-[#F8F8F9] w-full border-[0.5px]`.
  - Active: `bg-[#F8F8F9] border-[#dcdcdc]`. Idle: `border-transparent`.
  - Icon: 20px, stroke 1.5, black, always (no colour change).
  - Label: `ml-[10px]`.
  - Labels only: no subtitles, no footer.

### ActionHeader
- Row: `flex justify-between items-center h-[24px]`.
- Back button: 23px `#F8F8F9` circle with a black chevron (stroke 2), `mr-[5px]`.
- Header pill: `flex h-[23px] items-center px-[10px] bg-[#F8F8F9] rounded-[50px] text-[#333333] text-[10px]`.
- Primary header pill: `flex justify-center items-center h-[23px] px-[10px] bg-brand rounded-[50px] text-white text-[10px]`.

### Controls (34px)
- Pill tab:
  - Base: `flex h-[34px] items-center px-[10px] border-[0.5px] rounded-[50px] hover:bg-[#F8F8F9BF]`.
  - Active: `bg-[#F8F8F9BF] border-[#000] text-black`. Idle: `bg-white border-[#DCDCDC]`.
- Dropdown or date pill: `flex h-[34px] items-center px-[10px] bg-white hover:bg-[#F8F8F9BF] rounded-[50px] border-[0.5px] border-[#DCDCDC]`, with an 18px chevron (stroke `#333`, 1.25).
- Search pill:
  - Input: `h-[34px] w-full px-[30px] rounded-[50px] bg-[#FAFAFA] border-[0.5px] border-[#DCDCDC] text-[12px] font-light placeholder:text-[#808080] outline-none focus:border-[#404040]`.
  - 16px icon at `left-[10px]` (stroke `#808080`, 0.85); clear "x" at `right-[10px]`.
- Info chip: `flex h-[23px] items-center px-[10px] text-[10px] text-[#333333] bg-[#F8F8F9BF] rounded-[50px]`.
- Buttons:
  - Primary: `h-[34px] px-[15px] rounded-[5px] bg-brand hover:bg-brand-600 text-white text-[12px] font-medium`.
  - Secondary: `bg-[#F8F8F9] text-[#333333] border-[0.5px] border-[#C4C4C4] hover:border-[#404040] rounded-[5px] text-[12px]`.
  - Dark: `bg-black text-white rounded-[5px]`.
  - Danger: `bg-[#FF4359] hover:bg-[#E63C50]`.
  - Outline pill: `py-[4px] px-[10px] border-[1px] border-[#C4C4C4] rounded-[50px] text-[10px] hover:bg-[#F8F8F9]`.
  - Danger outline pill: `border-[#FF4359] text-[#FF4359] hover:bg-[#FF4359] hover:text-white`.
- Round icon button: `w-[30px] h-[30px] rounded-full flex justify-center items-center`.
  - Neutral hover `hover:bg-[#F8F8F9]`.
  - Brand hover `hover:bg-[#16A34A1A]` with the icon turning brand colour.
  - Danger: `hover:bg-[#FF43591A]` with a red icon.
- Form field:
  - Block: `flex flex-col gap-[5px]`. Label: `text-[14px] font-medium`.
  - Input: `bg-[#FAFAFA] py-[8px] px-[10px] rounded-[5px] text-[12px] border-[0.5px] border-[#dcdcdc] outline-none`.
- Toggle:
  - Track: `h-[22px] w-[40px] rounded-full`, `bg-brand` on, `bg-[#DCDCDC]` off.
  - Knob: `size-[18px] bg-white shadow-sm translate-x-[2px|20px]`.
- Checkbox: `rounded-[2px] border-[1.5px] border-[#c4c4c4]`; checked `bg-brand border-brand` with a white check.

### Cards
- Card: `border-[0.5px] border-[#dcdcdc] rounded-[10px] p-[15px] bg-white`.
- KPI card: a 40px `#F8F8F9` `rounded-[5px]` icon tile, value `text-[14px] font-semibold`, label `text-[12px] text-[#808080] mt-[2px]`, delta `text-[11px] font-semibold` with a 10px arrow.
  - KPI grid: `grid gap-x-[15px]` with 4 columns.
- Chart card:
  - Header: title 14/600 `#333`, optional `(subtitle)` 10px `#808080`, 15px info icon (`#aaa`, hover black), 15px download/expand icons on the right with `gap-[10px]`.
  - Plot: `mt-[10px] h-[250px]`.
- Gallery tile: `h-[200px] rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA]`, caption `text-[12px] font-medium`.
  - Gallery grid: `grid grid-cols-3 lg:grid-cols-4 gap-[20px]`.

### Tables
- Accounts style (grid):
  - Header: `grid grid-cols-7 border-b-[0.5px] border-[#C4C4C466]`.
  - Header cell: `py-[12px] px-[12px] border-r-[0.5px] border-[#C4C4C466] text-[12px] font-medium`.
  - Row: `grid grid-cols-7 border-b-[0.5px] border-[#C4C4C466] hover:bg-[#F8F8F9]`. Cell: `py-[8px] px-[12px]`.
- Data style: wrapper `rounded-[10px] border-[0.5px] border-[#dcdcdc]`.
  - Head: `bg-[#fafafa]`; th `px-[12px] py-[10px] text-[12px] font-medium text-[#555] border-b-[0.5px] border-[#dcdcdc]`.
  - Cell: td `px-[12px] py-[10px] text-[12px] border-b-[0.5px] border-[#f0f0f0]`.
  - Row hover: `#F8F8F9`.

### Lists (Inbox)
- Row: `h-[34px] px-[7px] rounded-[5px] border-[0.5px]`, active `border-[#DCDCDC] bg-[#FAFAFA]`.
  - Avatar: 27px with a 12px platform badge at the bottom-right.
  - Name: `text-[12px]`. Preview: `text-[10px] text-[#808080] truncate`.
- Rows sit `gap-[15px]` apart.

### Modals
- Overlay: `fixed inset-0 bg-[#00000A73] backdrop-blur-[5px] z-20 flex justify-center items-center`. Clicking the backdrop closes it.
- Container: `flex flex-col w-[400px] bg-white border-[0.5px] border-[#DCDCDC] rounded-[10px] p-[15px]`.
- Header: `flex justify-between items-center pb-[10px]`, title `text-[14px] font-medium`, 18px close "x" (stroke `#808080`). Then the divider `w-full h-[0.5px] bg-[#DCDCDC]`.
- Body: `mt-[15px] text-[12px] text-[#333333]`.
- Footer: `flex justify-between gap-[15px] mt-[15px]`, with Cancel (secondary) and primary or danger, each `w-[50%] py-[8px]`.
- Confirm dialog: `w-[300px] rounded-[14px]`, a centred body, and a split footer `border-t-[0.5px] border-[#EBEBEB]`.

### Tooltip
- Bubble: `bg-[#111] text-[#f5f5f5] text-[11px] leading-[1.6] rounded-[6px] px-[10px] py-[8px] border-[0.5px] border-[#dcdcdc] max-w-[220px] animate-fadeIn`, with an 8px rotated arrow and an 8px offset.
- Used on KPI cards, deltas, info icons and metric values.
- Icon buttons and truncated names use the native `title`.

### Icons
- Inline SVG only, with no icon library. Platform logos are image files.
- Sizes:
  - Nav: 20px, stroke 1.5, black.
  - UI: 16px, stroke 0.85–1, `#808080`, hover `#404040`.
  - Chart actions: 15px, stroke 1.5, `#aaa`, hover black.
  - Chevrons: 18–24px, stroke 1.25, `#333`.
  - Modal close: 18px, `#808080`.
  - KPI tiles: 24px, filled `#333`.
- Icons are functional only. They don't decorate headings, labels or ordinary text buttons.

### Feedback
- Skeleton: `animate-pulse` blocks `bg-gray-300 rounded-[5px]` in the real card shell.
- Empty state: centred `text-[12px] text-[#808080]` sentence. Larger empty states add a 40–48px circle icon, a 14px semibold title and 12px `#808080` text (`max-w-[280px] leading-[1.6]`).
- Toast: `fixed bottom-[24px] right-[24px] w-[320px] bg-white border-[0.5px] border-[#DCDCDC] rounded-[14px] shadow-[0_4px_20px_rgba(0,0,0,0.10)]`.

## 5. Copy

- Nav labels: 1–4 words, Title Case, at most about 23 characters.
- Page and card titles: 1–5 words ("Analytics", "Leads", "Custom Domains", "Top Countries").
- No description line under titles. Explanations go in an info-icon tooltip.
- Helper text appears only on settings rows: one sentence, `text-[10px] text-[#808080]`.
- Numbers: `12.4K`. Deltas show `4.20%` with an arrow; the colour carries the direction.
