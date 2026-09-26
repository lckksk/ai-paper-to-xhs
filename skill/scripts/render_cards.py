# -*- coding: utf-8 -*-
"""渲染小红书 3:4 卡片：pptx → PDF(soffice) → PNG(PyMuPDF, 1242×1656)

用法: python render_cards.py <卡片源文件.pptx> <输出目录> [PNG名1,PNG名2,PNG名3]
默认输出名: 封面卡.png, 内容卡1.png, 内容卡2.png
"""
import os
import shutil
import subprocess
import sys

SOFFICE_CANDIDATES = [
    shutil.which("soffice"),
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
]


def find_soffice():
    for p in SOFFICE_CANDIDATES:
        if p and os.path.exists(p):
            return p
    sys.exit("未找到 soffice。请先安装 LibreOffice（winget install TheDocumentFoundation.LibreOffice）")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    pptx, outdir = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
    names = (sys.argv[3].split(",") if len(sys.argv) > 3
             else ["封面卡.png", "内容卡1.png", "内容卡2.png"])
    os.makedirs(outdir, exist_ok=True)

    soffice = find_soffice()
    subprocess.run(
        [soffice, "--headless", "--convert-to", "pdf", "--outdir", outdir, pptx],
        check=True, capture_output=True, timeout=300,
    )
    pdf = os.path.join(outdir, os.path.splitext(os.path.basename(pptx))[0] + ".pdf")

    import fitz  # PyMuPDF
    doc = fitz.open(pdf)
    if len(doc) != len(names):
        print(f"警告: pptx 有 {len(doc)} 页，但给了 {len(names)} 个输出名，按页数为准")
        names = [f"卡片{i+1}.png" for i in range(len(doc))]
    # 7.5×10in = 540×720pt，×2.3 → 1242×1656px
    zoom = 1242 / 540
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
        out = os.path.join(outdir, names[i])
        pix.save(out)
        print(f"OK {out} {pix.width}x{pix.height}")
    doc.close()
    os.remove(pdf)


if __name__ == "__main__":
    main()
