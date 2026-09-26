# -*- coding: utf-8 -*-
"""把整套系统打包为可迁移 bundle（在本工作区运行）

用法:
    python export_bundle.py [--no-data] [--force]

产出: migration/jiedu-lunwen-bundle-<日期>/ 与同名 .zip
  ├── README-迁移指南.md
  ├── skill/                  jiedu-lunwen（含迁移脚本）
  ├── humanize-writing/       第三方去AI味 skill（用户级安装）
  ├── workspace-seed/         新工作区种子（sources.md、templates/）
  └── data/                   当前工作区数据存档（weekly/、posts/、topics.xlsx）
"""
import datetime
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)                          # .agents/skills/jiedu-lunwen
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))   # 工作区根（scripts→skill→skills→.agents→root）
README = """# 「论文与博客解读」迁移包（{date}）

一套 AI 论文/厂商博客 → 小红书发布物的完整流水线：采集 → 候选 → 自动选题 → 事实核对 → 成稿（去AI味）→ 3:4 卡片 → 渲染 → 台账。

## 内容清单

| 目录 | 用途 | 安装位置 |
|---|---|---|
| `skill/` | jiedu-lunwen 主 skill（含迁移脚本） | `<工作区>/.agents/skills/jiedu-lunwen/` |
| `humanize-writing/` | 去 AI 味 skill（第三方，MIT） | `~/.agents/skills/humanize-writing/`（用户级） |
| `workspace-seed/` | 新工作区种子（sources.md、笔记模板） | `<工作区>/` 下对应位置 |
| `data/` | 打包当日的运行数据（weekly/、posts/、topics.xlsx） | 可选，拷到 `<工作区>/` 同名位置 |

## 迁移三步

```bash
# 1) 环境自检（会列出缺失项与安装命令；--fix 自动装 pip/npm 部分）
python skill/scripts/setup_env.py --fix

# 2) 初始化工作区并安装两个 skill
python skill/scripts/bootstrap_workspace.py <新工作区路径>

# 3) 用 ZCode 打开新工作区，说「跑今天」/「跑最近一周」/「解读这篇 + 链接」
```

旧数据迁移（可选）：把旧机 `weekly/`、`posts/`、`topics.xlsx` 拷到新工作区同名位置。

## 依赖清单（setup_env.py 会自动检查）

- Python ≥3.9 + openpyxl / PyMuPDF / python-pptx
- Node.js + 全局 pptxgenjs
- LibreOffice（soffice，渲染 PNG 必需，几百 MB；清华镜像安装）
- 字体 Microsoft YaHei（Windows 自带；macOS 把卡片脚本 FONT 改为 PingFang SC）
- ZCode 内置工具：web_reader / browser-use / WebSearch；visual-judge 子代理（不可用时自动降级自查）

## 关键文件速查

| 文件 | 作用 |
|---|---|
| `skill/SKILL.md` | 全流程编排（按需触发、采集窗口、产能规则） |
| `skill/assets/卡片模板.js` | 3:4 卡片骨架（改内容不改骨架；accent 跟随选题方品牌色） |
| `skill/scripts/render_cards.py` | pptx → 1242×1656 PNG（soffice + PyMuPDF） |
| `skill/scripts/count_body.py` | 标题/正文字数实测（硬约束） |
| `skill/references/卡片规范.md`、`中文AI味清单.md` | 设计规范 / 中文去AI味词表 |
| `workspace-seed/sources.md` | 信息源 + 热度评判标准 + 采集产出规范 |

## 更新本 bundle

在旧工作区重跑 `python .agents/skills/jiedu-lunwen/scripts/export_bundle.py` 即可按当日状态重新打包。
"""

IGNORE = shutil.ignore_patterns("__pycache__", "*.pyc", "node_modules")


def copy(src, dst, force=False):
    if not os.path.exists(src):
        print(f"  ⚠️ 跳过不存在的: {src}")
        return False
    shutil.copytree(src, dst, dirs_exist_ok=force or True, ignore=IGNORE)
    return True


def main():
    no_data = "--no-data" in sys.argv
    force = "--force" in sys.argv
    date = datetime.date.today().strftime("%Y-%m-%d")
    out = os.path.join(ROOT, "migration", f"jiedu-lunwen-bundle-{date}")
    if os.path.exists(out):
        if not force:
            sys.exit(f"已存在 {out}\n覆盖请加 --force")
        shutil.rmtree(out)
    os.makedirs(out)
    print(f"打包到: {out}\n")

    print("  skill/ …");        copy(SKILL, os.path.join(out, "skill"))
    print("  humanize-writing/ …")
    copy(os.path.join(os.path.expanduser("~"), ".agents", "skills", "humanize-writing"),
         os.path.join(out, "humanize-writing"))
    print("  workspace-seed/ …")
    os.makedirs(os.path.join(out, "workspace-seed", "templates"), exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "sources.md"), os.path.join(out, "workspace-seed", "sources.md"))
    shutil.copy2(os.path.join(ROOT, "templates", "小红书笔记模板.md"),
                 os.path.join(out, "workspace-seed", "templates", "小红书笔记模板.md"))
    if not no_data:
        print("  data/ …（weekly/、posts/、topics.xlsx）")
        for item in ("weekly", "posts"):
            copy(os.path.join(ROOT, item), os.path.join(out, "data", item))
        os.makedirs(os.path.join(out, "data"), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, "topics.xlsx"), os.path.join(out, "data", "topics.xlsx"))

    with open(os.path.join(out, "README-迁移指南.md"), "w", encoding="utf-8") as f:
        f.write(README.format(date=date))

    zip_path = shutil.make_archive(out, "zip", root_dir=os.path.dirname(out), base_dir=os.path.basename(out))
    size = sum(os.path.getsize(os.path.join(r, f)) for r, _d, fs in os.walk(out) for f in fs)
    print(f"\n完成: {out}")
    print(f"压缩包: {zip_path}（目录 {size/1024/1024:.1f} MB）")
    print("迁移: 解压到新机 → python skill/scripts/setup_env.py → python skill/scripts/bootstrap_workspace.py <路径>")


if __name__ == "__main__":
    main()
