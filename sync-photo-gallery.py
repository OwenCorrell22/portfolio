#!/usr/bin/env python3
"""Regenerate photography.html gallery and collection stacks from collections.json."""
import json
import re
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent


def load_attrs(i: int) -> str:
    if i <= 3:
        return ' loading="eager" fetchpriority="high"'
    if i <= 9:
        return ' loading="eager"'
    return ' loading="lazy"'


def member_ids(collections: list, excluded: set[int]) -> set[int]:
    members: set[int] = set(excluded)
    for col in collections:
        members.update(col.get("photos", []))
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


def entry_preview_src(col: dict, img_dir: str = "thumbs") -> Optional[str]:
    if col.get("previewSrc"):
        return col["previewSrc"]
    if col.get("preview") is not None:
        return f"assets/{img_dir}/{col['preview']}.jpg"
    photos = col.get("photos") or []
    if not photos:
        return None
    cover = col.get("cover")
    preview_id: Optional[int] = None
    if cover is not None:
        if photos[0] == cover and len(photos) > 1:
            preview_id = photos[1]
        else:
            for pid in photos:
                if pid != cover:
                    preview_id = pid
                    break
    elif len(photos) > 1:
        preview_id = photos[1]
    if preview_id is None:
        return None
    return f"assets/{img_dir}/{preview_id}.jpg"


def build_gallery_entries(
    collections: list, start_idx: int = 1, img_dir: str = "thumbs"
) -> tuple[list[str], int]:
    lines: list[str] = []
    idx = start_idx
    for col in collections:
        slug = col["slug"]
        title = col.get("title", slug)
        cover_src = entry_cover_src(col, img_dir)
        preview_src = entry_preview_src(col, img_dir)
        desc = col.get("description", "").strip()
        desc_html = (
            f'\n        <span class="photo-collection-desc">{desc}</span>' if desc else ""
        )
        preview_html = (
            f'\n          <img src="{preview_src}" alt="" class="photo-collection-preview" '
            f'loading="lazy" decoding="async" aria-hidden="true">'
            if preview_src
            else ""
        )
        lines.append(
            f'      <div class="photo-collection-block">\n'
            f'        <span class="photo-collection-title">{title}</span>{desc_html}\n'
            f'        <a href="{slug}.html" class="photo-collection-card-link" '
            f'aria-label="{title}">\n'
            f'          <span class="photo-collection-card">\n'
            f'          <img src="{cover_src}" alt="{title} collection"{load_attrs(idx)} '
            f'decoding="async" class="photo-collection-cover visible">{preview_html}\n'
            f"          </span>\n"
            f"        </a>\n"
            f"      </div>"
        )
        idx += 1
    return lines, idx


def build_gallery(collections: list, excluded: set[int]) -> str:
    member_set = member_ids(collections, excluded)
    max_id = max(66, max(member_set) if member_set else 66)
    singles = [n for n in range(1, max_id + 1) if n not in member_set]
    gallery_class = "photo-gallery photo-gallery--collections" if not singles else "photo-gallery"

    lines, idx = build_gallery_entries(collections)
    for n in singles:
        lines.append(
            f'      <div class="photo-cell">\n'
            f'        <span class="photo-index">{n}</span>\n'
            f'        <img src="assets/thumbs/{n}.jpg" alt="Photograph {n} by Owen Correll"{load_attrs(idx)} '
            f'decoding="async" data-full="assets/view/{n}.jpg" data-thumb="assets/thumbs/{n}.jpg">\n'
            f"      </div>"
        )
        idx += 1

    return f"    <div class=\"{gallery_class}\">\n" + "\n".join(lines) + "\n    </div>"


def build_hub_gallery(subcollections: list) -> str:
    lines, _ = build_gallery_entries(subcollections, start_idx=1, img_dir="view")
    return f'    <div class="photo-gallery photo-gallery--collections">\n' + "\n".join(lines) + "\n    </div>"


def update_collection_header(
    path: Path, title: str, description: str, back_href: str = "photography.html"
) -> None:
    desc_block = (
        f'\n      <p class="collection-desc">{description}</p>' if description.strip() else ""
    )
    header = (
        f'    <header class="collection-header">\n'
        f'      <a href="{back_href}" class="collection-back" aria-label="Back">←</a>\n'
        f'      <p class="collection-title">{title}</p>{desc_block}\n'
        f"    </header>"
    )
    text = path.read_text()
    text = re.sub(
        r"    <header class=\"collection-header\">.*?</header>",
        header,
        text,
        count=1,
        flags=re.DOTALL,
    )
    path.write_text(text)


def replace_hub_gallery(path: Path, gallery_html: str) -> None:
    text = path.read_text()
    if 'class="collection-stack"' in text:
        text = re.sub(
            r'    <div class="collection-stack">.*?</div>\n  </main>',
            gallery_html + "\n  </main>",
            text,
            count=1,
            flags=re.DOTALL,
        )
    else:
        gallery = gallery_html.strip()

        def _inject_hub(match: re.Match[str]) -> str:
            return match.group(1) + gallery + "\n\n  </main>"

        text = re.sub(
            r"(    </header>\n)(.*?)(  </main>)",
            _inject_hub,
            text,
            count=1,
            flags=re.DOTALL,
        )
    if "collection-hub" not in text and "collection-page" in text:
        text = text.replace(
            '<main class="collection-page">',
            '<main class="collection-page collection-hub">',
            1,
        )
    path.write_text(text)


def update_collection_media(path: Path, sub: dict) -> None:
    src = sub["coverSrc"]
    title = sub.get("title", sub["slug"])
    caption = sub.get("caption", sub.get("description", "")).strip()
    caption_html = f'\n      <p class="collection-media-caption">{caption}</p>' if caption else ""
    stack = (
        '    <div class="collection-stack collection-stack--media">\n'
        f'      <figure class="collection-item collection-item--media">\n'
        f'        <img src="{src}" alt="{title}" loading="eager" decoding="async">\n'
        f"      </figure>{caption_html}\n"
        "    </div>"
    )
    text = path.read_text()
    def _inject_media(match: re.Match[str]) -> str:
        return match.group(1) + stack + "\n\n  </main>"

    text = re.sub(
        r"(    </header>\n)(.*?)(  </main>)",
        _inject_media,
        text,
        count=1,
        flags=re.DOTALL,
    )
    path.write_text(text)


def update_collection_stack(path: Path, photos: list[int]) -> None:
    if not photos:
        return
    figures = []
    for i, n in enumerate(photos):
        load = "eager" if i == 0 else "lazy"
        figures.append(
            f'      <figure class="collection-item"><span class="photo-index">{n}</span>'
            f'<img src="assets/view/{n}.jpg" alt="{n}" loading="{load}" decoding="async"></figure>'
        )
    text = path.read_text()
    if 'class="collection-stack"' not in text:
        text = text.replace(
            "  </header>\n",
            "  </header>\n    <div class=\"collection-stack\">\n"
            + "\n".join(figures)
            + "\n    </div>\n",
            1,
        )
        path.write_text(text)
        return
    start = text.index('    <div class="collection-stack">')
    end = text.index("    </div>\n  </main>", start)
    stack = "    <div class=\"collection-stack\">\n" + "\n".join(figures) + "\n    </div>"
    path.write_text(text[:start] + stack + text[end + len("    </div>") :])


def main() -> None:
    data = json.loads((ROOT / "collections.json").read_text())
    collections = data["collections"]
    excluded = set(data.get("excluded", []))

    gallery = build_gallery(collections, excluded)
    photo_html = ROOT / "photography.html"
    html = photo_html.read_text()
    m = re.search(r'    <div class="photo-gallery[^"]*">', html)
    if not m:
        raise SystemExit("photo-gallery block not found in photography.html")
    start = m.start()
    end = html.index("  <footersub>")
    photo_html.write_text(html[:start] + gallery + "\n" + html[end:])

    for col in collections:
        slug = col["slug"]
        page = ROOT / f"{slug}.html"
        subs = col.get("subcollections", [])
        if subs and page.exists():
            update_collection_header(page, col.get("title", slug), col.get("description", ""))
            replace_hub_gallery(page, build_hub_gallery(subs))
            for sub in subs:
                sub_page = ROOT / f'{sub["slug"]}.html'
                if sub_page.exists():
                    update_collection_header(
                        sub_page,
                        sub.get("title", sub["slug"]),
                        "",
                        back_href=f"{slug}.html",
                    )
                    if sub.get("coverSrc") and not sub.get("photos"):
                        update_collection_media(sub_page, sub)
                    else:
                        update_collection_stack(sub_page, sub["photos"])
            continue
        if page.exists():
            update_collection_header(
                page, col.get("title", slug), col.get("description", "")
            )
            update_collection_stack(page, col["photos"])

    print(f"OK: {len(collections)} collections synced")


if __name__ == "__main__":
    main()
