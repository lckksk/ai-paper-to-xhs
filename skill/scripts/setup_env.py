# -*- coding: utf-8 -*-
"""环境自检与安装指引 —— 迁移到新机器时先运行本脚本

用法:
    python setup_env.py          # 自检
    python setup_env.py --fix    # 自动安装 pip / npm 依赖（LibreOffice 只给指引）
"""
import importlib.util
import os
import platform
import shutil
import subprocess
import sys

OK, BAD = "  [OK] ", "  [缺失] "
PIP_MIRROR = "https://pypi.tuna.tsinghua.edu.cn/simple"
SOFFICE_PATHS = [
    shutil.which("soffice"),
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    "/usr/local/bin/soffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
]


def has_mod(name):
    return importlib.util.find_spec(name) is not None


def run(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=60).returncode == 0
    except Exception:
        return False


def npm_runner():
    """Windows 上 npm 是 .cmd 批处理，subprocess 需要 cmd /c 才能调用"""
    npm = shutil.which("npm") or "npm"
    return (["cmd", "/c", npm] if os.name == "nt" else [npm])


def main(fix=False):
    print(f"平台: {platform.system()} {platform.release()} | Python {platform.python_version()}\n")
    missing = []

    # Python 依赖
    for mod, pkg in [("openpyxl", "openpyxl"), ("fitz", "PyMuPDF"), ("pptx", "python-pptx")]:
        if has_mod(mod):
            print(f"{OK}Python 包 {pkg}")
        else:
            missing.append(("pip", pkg)); print(f"{BAD}Python 包 {pkg}")

    # Node / pptxgenjs
    if shutil.which("node") and shutil.which("npm"):
        print(f"{OK}Node.js: " + shutil.which("node"))
        try:
            npm_root = subprocess.run(npm_runner() + ["root", "-g"], capture_output=True, text=True, timeout=60).stdout.strip()
        except Exception:
            npm_root = ""
        if npm_root and os.path.isdir(os.path.join(npm_root, "pptxgenjs")):
            print(f"{OK}npm 全局包 pptxgenjs")
        else:
            missing.append(("npm", "pptxgenjs")); print(f"{BAD}npm 全局包 pptxgenjs")
    else:
        missing.append(("node", None)); print(f"{BAD}Node.js（https://nodejs.org 安装）")

    # LibreOffice（渲染 PNG 必需）
    soffice = next((p for p in SOFFICE_PATHS if p and shutil.which(p) or (p and __import__("os").path.exists(p))), None)
    if soffice:
        print(f"{OK}LibreOffice (soffice): {soffice}")
    else:
        missing.append(("soffice", None)); print(f"{BAD}LibreOffice (soffice)")

    # 中文字体（卡片渲染用；macOS 自带苹方，可把 FONT 常量改为 PingFang SC）
    if platform.system() == "Windows" and os.path.exists(r"C:\Windows\Fonts\msyh.ttc"):
        print(f"{OK}字体 Microsoft YaHei")
    elif platform.system() != "Windows":
        print(f"{WARN if False else OK}字体: 非 Windows 系统，若缺微软雅黑请把卡片脚本 FONT 改为系统字体（如 PingFang SC）")
    else:
        missing.append(("font", None)); print(f"{BAD}字体 Microsoft YaHei")

    # ZCode 内置工具（无法脚本检测，仅提醒）
    print(f"{OK}ZCode 内置: web_reader / browser-use / WebSearch（随 ZCode 自带）")
    print(f"{OK}子代理 visual-judge（可选；不可用时流程自动降级为自查）\n")

    if not missing:
        print("环境就绪。"); return 0

    print("---- 缺失项处理 ----")
    pip_missing = [p for kind, p in missing if kind == "pip"]
    npm_missing = [p for kind, p in missing if kind == "npm"]
    if fix:
        if pip_missing:
            subprocess.run([sys.executable, "-m", "pip", "install", *pip_missing, "-i", PIP_MIRROR])
        if npm_missing:
            subprocess.run(npm_runner() + ["install", "-g", *npm_missing])
        if any(kind == "node" for kind, _ in missing):
            print("请先安装 Node.js: https://nodejs.org")
    else:
        if pip_missing:
            print(f"pip 安装: python -m pip install {' '.join(pip_missing)} -i {PIP_MIRROR}")
        if npm_missing:
            print(f"npm 安装: npm install -g {' '.join(npm_missing)}")
    if any(kind == "soffice" for kind, _ in missing):
        print("LibreOffice（渲染 PNG 必需，几百 MB）:")
        print("  Windows: winget install TheDocumentFoundation.LibreOffice")
        print("  或清华镜像: https://mirrors.tuna.tsinghua.edu.cn/libreoffice/libreoffice/stable/ → win/x86_64/*.msi")
        print("  macOS: brew install --cask libreoffice | Linux: sudo apt install libreoffice-core")
        print("  装完确认: soffice --version")
    return 1


if __name__ == "__main__":
    sys.exit(main(fix="--fix" in sys.argv))
