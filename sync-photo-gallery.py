#!/usr/bin/env python3
"""Regenerate photography.html gallery and collection stacks from collections.json."""
import json
import re
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent
EXPLORER_ROOT = "C:/My Documents/Photos"


def load_attrs(i: int) -> str:
    if i <= 3:
        return ' loading="eager" fetchpriority="high"'
    if i <= 9:
        return ' loading="eager"'
    return ' loading="lazy"'


def is_photo_collection(col: dict) -> bool:
    return col.get("kind") != "external-link"


def member_ids(collections: list, excluded: set[int]) -> set[int]:
    members: set[int] = set(excluded)
    for col in collections:
        if not is_photo_collection(col):
            continue
        members.update(col.get("photos", []))
        if "cover" in col:
            members.add(col["cover"])
        for sub in col.get("subcollections", []):
            members.update(sub.get("photos", []))
            if "cover" in sub:
                members.add(sub["cover"])
    return members


def entry_cover_src(col: dict, img_dir: str = "thumbs") -> str:
    if col.get("coverSrc"):
        return col["coverSrc"]
    return f"assets/{img_dir}/{col['cover']}.jpg"


def explorer_address_path(*parts: str) -> str:
    suffix = "/".join(parts) if parts else ""
    return f"{EXPLORER_ROOT}/{suffix}" if suffix else EXPLORER_ROOT


def build_folder_entries(
    collections: list, start_idx: int = 1, img_dir: str = "thumbs"
) -> tuple[list[str], int]:
    lines: list[str] = []
    idx = start_idx
    for col in collections:
        title = col.get("title", col.get("slug", ""))
        cover_src = entry_cover_src(col, img_dir)
        if col.get("kind") == "external-link":
            href = col["href"]
            lines.append(
                f'      <article class="explorer-item explorer-item--folder explorer-item--external">\n'
                f'        <a href="{href}" class="explorer-item-link" target="_blank" '
                f'rel="noopener noreferrer" aria-label="{title}">\n'
                f'          <span class="explorer-item-icon" aria-hidden="true">\n'
                f'            <img src="{cover_src}" alt=""{load_attrs(idx)} decoding="async" '
                f'class="explorer-item-thumb visible">\n'
                f"          </span>\n"
                f'          <span class="explorer-item-label">{title}</span>\n'
                f"        </a>\n"
                f"      </article>"
            )
            idx += 1
            continue
        slug = col["slug"]
        lines.append(
            f'      <article class="explorer-item explorer-item--folder">\n'
            f'        <a href="{slug}.html" class="explorer-item-link" aria-label="{title}">\n'
            f'          <span class="explorer-item-icon" aria-hidden="true">\n'
            f'            <img src="{cover_src}" alt=""{load_attrs(idx)} decoding="async" '
            f'class="explorer-item-thumb visible">\n'
            f"          </span>\n"
            f'          <span class="explorer-item-label">{title}</span>\n'
            f"        </a>\n"
            f"      </article>"
        )
        idx += 1
    return lines, idx


def build_root_gallery(collections: list, excluded: set[int]) -> str:
    member_set = member_ids(collections, excluded)
    max_id = max(66, max(member_set) if member_set else 66)
    singles = [n for n in range(1, max_id + 1) if n not in member_set]

    lines, idx = build_folder_entries(collections)
    for n in singles:
        lines.append(
            f'      <div class="photo-cell explorer-item explorer-item--file">\n'
            f'        <span class="photo-index">{n}</span>\n'
            f'        <img src="assets/thumbs/{n}.jpg" alt="Photograph {n} by Owen Correll"{load_attrs(idx)} '
            f'decoding="async" data-full="assets/view/{n}.jpg" data-thumb="assets/thumbs/{n}.jpg">\n'
            f"      </div>"
        )
        idx += 1

    obj_count = len(collections) + len(singles)
    gallery_class = "photo-gallery photo-gallery--icons photo-gallery--folders"
    if singles:
        gallery_class += " photo-gallery--mixed"

    return (
        f'    <div class="explorer-view explorer-view--icons">\n'
        f'      <div class="{gallery_class}">\n'
        + "\n".join(lines)
        + f"\n      </div>\n"
        f"    </div>\n"
        f'    <footer class="explorer-statusbar">\n'
        f'      <span class="explorer-statusbar-section">{obj_count} object(s)</span>\n'
        f'      <span class="explorer-statusbar-section explorer-statusbar-grow">35mm archive</span>\n'
        f"    </footer>"
    )


def build_hub_gallery(subcollections: list) -> str:
    lines, _ = build_folder_entries(subcollections, start_idx=1, img_dir="thumbs")
    count = len(subcollections)
    return (
        f'    <div class="explorer-view explorer-view--icons">\n'
        f'      <div class="photo-gallery photo-gallery--icons photo-gallery--folders">\n'
        + "\n".join(lines)
        + f"\n      </div>\n"
        f"    </div>\n"
        f'    <footer class="explorer-statusbar">\n'
        f'      <span class="explorer-statusbar-section">{count} folder(s)</span>\n'
        f'      <span class="explorer-statusbar-section explorer-statusbar-grow"></span>\n'
        f"    </footer>"
    )


def build_photo_icon_stack(photos: list[int]) -> str:
    cells = []
    for i, n in enumerate(photos):
        cells.append(
            f'        <div class="photo-cell explorer-item explorer-item--file">\n'
            f'          <span class="photo-index">{n}</span>\n'
            f'          <img src="assets/view/{n}.jpg" alt="Photograph {n}"{load_attrs(i + 1)} '
            f'decoding="async" data-full="assets/view/{n}.jpg" data-thumb="assets/view/{n}.jpg">\n'
            f"        </div>"
        )
    count = len(photos)
    return (
        f'    <div class="explorer-view explorer-view--icons explorer-view--collection-photos">\n'
        f'      <div class="collection-stack photo-gallery photo-gallery--icons photo-gallery--photos">\n'
        + "\n".join(cells)
        + f"\n      </div>\n"
        f"    </div>\n"
        f'    <footer class="explorer-statusbar">\n'
        f'      <span class="explorer-statusbar-section">{count} object(s)</span>\n'
        f'      <span class="explorer-statusbar-section explorer-statusbar-grow">double-click to open</span>\n'
        f"    </footer>"
    )


def build_explorer_open(window_title: str, address: str, back_href: str) -> str:
    return (
        f'    <section class="explorer-window">\n'
        f'      <header class="explorer-titlebar">\n'
        f'        <span class="explorer-titlebar-text">{window_title}</span>\n'
        f"      </header>\n"
        f'      <div class="explorer-toolbar" role="toolbar">\n'
        f'        <a href="{back_href}" class="explorer-tool explorer-tool--back" aria-label="Back">←</a>\n'
        f"      </div>\n"
        f'      <p class="explorer-address">\n'
        f'        <span class="explorer-address-label">Address</span>\n'
        f'        <span class="explorer-address-path">{address}</span>\n'
        f"      </p>\n"
    )


def migrate_hub_to_explorer(path: Path, col: dict) -> None:
    text = path.read_text()
    if 'class="explorer-window"' in text:
        return
    window, address, _ = hub_explorer_meta(col)
    chrome = build_explorer_open(window, address, "photography.html")
    text = re.sub(
        r"    <header class=\"collection-header\">.*?</header>\n?",
        "",
        text,
        count=1,
        flags=re.DOTALL,
    )
    text = re.sub(
        r'(<main class="collection-page)(?: collection-hub)?">\n',
        r'\1 collection-hub">\n' + chrome + "\n",
        text,
        count=1,
    )
    path.write_text(text)


def replace_hub_content(path: Path, body_html: str) -> None:
    text = path.read_text()
    body = body_html.strip()
    if 'class="explorer-view"' in text:
        text = re.sub(
            r"    <div class=\"explorer-view explorer-view--icons\">.*?"
            r"    </footer>\n(?:    </section>\n)?",
            body + "\n",
            text,
            count=1,
            flags=re.DOTALL,
        )
    elif re.search(r'class="photo-gallery photo-gallery', text):
        text = re.sub(
            r"\s*<div class=\"photo-gallery photo-gallery[^\"]*\">.*?(?=\s*</main>)",
            "\n" + body + "\n",
            text,
            count=1,
            flags=re.DOTALL,
        )
    elif 'class="explorer-window"' in text:
        text = text.replace("  </main>", body + "\n  </main>", 1)
    if "collection-hub" not in text and "collection-page" in text:
        text = text.replace(
            '<main class="collection-page">',
            '<main class="collection-page collection-hub">',
            1,
        )
    path.write_text(text)


def rebuild_collection_main(
    path: Path, chrome: str, body_html: str, *, hub: bool = False
) -> None:
    text = path.read_text()
    hub_class = " collection-hub" if hub else ""
    main = (
        f'  <main class="collection-page{hub_class}">\n'
        f"{chrome.rstrip()}\n"
        f"{body_html.strip()}\n"
        f"    </section>\n"
        f"  </main>"
    )
    text = re.sub(
        r'  <main class="collection-page[^"]*">.*?</main>',
        main,
        text,
        count=1,
        flags=re.DOTALL,
    )
    path.write_text(text)


def update_collection_media(path: Path, sub: dict, back_href: str) -> None:
    src = sub["coverSrc"]
    title = sub.get("title", sub["slug"])
    caption = sub.get("caption", sub.get("description", "")).strip()
    caption_html = (
        f'\n        <p class="collection-media-caption">{caption}</p>' if caption else ""
    )
    body = (
        f'    <div class="explorer-view explorer-view--media">\n'
        f'      <div class="collection-stack collection-stack--media">\n'
        f'        <figure class="collection-item collection-item--media">\n'
        f'          <img src="{src}" alt="{title}" loading="eager" decoding="async">\n'
        f"        </figure>{caption_html}\n"
        f"      </div>\n"
        f"    </div>\n"
        f'    <footer class="explorer-statusbar">\n'
        f'      <span class="explorer-statusbar-section">1 object</span>\n'
        f'      <span class="explorer-statusbar-section explorer-statusbar-grow">video</span>\n'
        f"    </footer>"
    )
    # caller must rebuild main with chrome + body


def sync_photography_page(collections: list, excluded: set[int]) -> None:
    photo_html = ROOT / "photography.html"
    html = photo_html.read_text()
    body = build_root_gallery(collections, excluded)
    obj_count = len(collections)

    if 'id="sync-explorer-body"' in html:
        html = re.sub(
            r"<!-- sync:explorer-body:start -->.*?<!-- sync:explorer-body:end -->",
            f"<!-- sync:explorer-body:start -->\n{body}\n    <!-- sync:explorer-body:end -->",
            html,
            count=1,
            flags=re.DOTALL,
        )
        html = re.sub(
            r'(<span class="explorer-statusbar-section">)\d+ object\(s\)(</span>)',
            rf"\g<1>{obj_count} object(s)\g<2>",
            html,
            count=1,
        )
    elif 'class="explorer-window"' in html:
        html = re.sub(
            r"    <div class=\"explorer-view explorer-view--icons\">.*?"
            r"    </footer>\n",
            body + "\n",
            html,
            count=1,
            flags=re.DOTALL,
        )
    else:
        m = re.search(r'    <div class="photo-gallery[^"]*">', html)
        if not m:
            raise SystemExit("photo-gallery / explorer block not found in photography.html")
        start = m.start()
        end = html.index("  <footersub>")
        html = html[:start] + body + "\n" + html[end:]
    photo_html.write_text(html)


def hub_explorer_meta(col: dict) -> tuple[str, str, str]:
    slug = col["slug"]
    title = col.get("title", slug)
    address = explorer_address_path(title)
    window = f"{title} — Photos"
    return window, address, title


def sub_explorer_meta(sub: dict, hub: dict) -> tuple[str, str]:
    hub_title = hub.get("title", hub["slug"])
    title = sub.get("title", sub["slug"])
    address = explorer_address_path(hub_title, title)
    window = f"{title} — Photos"
    return window, address


HUB_PAGE_SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <meta name="theme-color" content="#1c1c1b">
  <meta name="description" content="{title} — photo collection by Owen Correll.">
  <title>{title} – Owen Correll</title>
  <link rel="stylesheet" href="style.css?v=42">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
</head>
<body>
  <nav>
    <a href="index.html" class="name">Owen Correll</a>
    <div class="nav-links">
      <div class="nav-item-with-sub">
        <button type="button" class="work-toggle">#<span class="nav-id" data-base="4A2F7E">4A2F7E</span>____work</button>
        <div class="sub-links">
          <a href="code.html">#<span class="nav-id nav-id--sub" data-base="7F2">7F2</span>___code</a>
          <a href="photography.html">#<span class="nav-id nav-id--sub" data-base="E4A">E4A</span>___photo</a>
          <a href="film.html">#<span class="nav-id nav-id--sub" data-base="C9D">C9D</span>___video</a>
          <a href="resume.html">#<span class="nav-id nav-id--sub" data-base="6E3">6E3</span>___resume</a>
        </div>
      </div>
      <a href="about.html">#<span class="nav-id" data-base="7B3E90">7B3E90</span>____about</a>
      <a href="contact.html">#<span class="nav-id" data-base="C9D1F6">C9D1F6</span>____contact</a>
    </div>
  </nav>

  <main class="collection-page collection-hub">
PLACEHOLDER
  </main>

  <footer><span>&copy; 2025 Owen Correll</span></footer>
  <script src="scripts.js?v=27"></script>
</body>
</html>
"""


def ensure_hub_page(col: dict) -> Path:
    slug = col["slug"]
    page = ROOT / f"{slug}.html"
    title = col.get("title", slug)
    if not page.exists():
        window, address, _ = hub_explorer_meta(col)
        chrome = build_explorer_open(window, address, "photography.html")
        page.write_text(
            HUB_PAGE_SHELL.format(title=title.title()).replace(
                "PLACEHOLDER", chrome + "\n"
            )
        )
    return page


def main() -> None:
    data = json.loads((ROOT / "collections.json").read_text())
    collections = data["collections"]
    excluded = set(data.get("excluded", []))

    sync_photography_page(collections, excluded)

    for col in collections:
        if not is_photo_collection(col):
            continue
        slug = col["slug"]
        subs = col.get("subcollections", [])
        if subs:
            page = ensure_hub_page(col)
            window, address, _ = hub_explorer_meta(col)
            chrome = build_explorer_open(window, address, "photography.html")
            rebuild_collection_main(page, chrome, build_hub_gallery(subs), hub=True)
            for sub in subs:
                sub_page = ROOT / f'{sub["slug"]}.html'
                if not sub_page.exists():
                    continue
                window, address = sub_explorer_meta(sub, col)
                chrome = build_explorer_open(window, address, f"{slug}.html")
                if sub.get("coverSrc") and not sub.get("photos"):
                    src = sub["coverSrc"]
                    title = sub.get("title", sub["slug"])
                    caption = sub.get("caption", sub.get("description", "")).strip()
                    caption_html = (
                        f'\n        <p class="collection-media-caption">{caption}</p>'
                        if caption
                        else ""
                    )
                    body = (
                        f'    <div class="explorer-view explorer-view--media">\n'
                        f'      <div class="collection-stack collection-stack--media">\n'
                        f'        <figure class="collection-item collection-item--media">\n'
                        f'          <img src="{src}" alt="{title}" loading="eager" decoding="async">\n'
                        f"        </figure>{caption_html}\n"
                        f"      </div>\n"
                        f"    </div>\n"
                        f'    <footer class="explorer-statusbar">\n'
                        f'      <span class="explorer-statusbar-section">1 object</span>\n'
                        f'      <span class="explorer-statusbar-section explorer-statusbar-grow">video</span>\n'
                        f"    </footer>"
                    )
                    rebuild_collection_main(sub_page, chrome, body)
                else:
                    rebuild_collection_main(
                        sub_page, chrome, build_photo_icon_stack(sub["photos"])
                    )
            continue
        page = ROOT / f"{slug}.html"
        if page.exists():
            title = col.get("title", slug)
            window = f"{title} — Photos"
            address = explorer_address_path(title)
            chrome = build_explorer_open(window, address, "photography.html")
            rebuild_collection_main(page, chrome, build_photo_icon_stack(col["photos"]))

    n = sum(1 for c in collections if is_photo_collection(c))
    print(f"OK: {n} collections synced")


if __name__ == "__main__":
    main()
