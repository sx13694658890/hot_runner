"""模具热流道规格单页 PDF（ReportLab + 内置 STSong-Light 中文）。"""

from __future__ import annotations

from io import BytesIO
from typing import Any
from uuid import UUID
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.constants.hrspec_pdf import HRSPEC_PDF_VALUE_KEYS

_FONT_REGISTERED = False


def _ensure_cjk_font() -> str:
    global _FONT_REGISTERED
    name = "STSong-Light"
    if not _FONT_REGISTERED:
        pdfmetrics.registerFont(UnicodeCIDFont(name))
        _FONT_REGISTERED = True
    return name


def _p(text: str, *, font: str, size: float = 9, leading: float | None = None) -> Paragraph:
    ld = leading if leading is not None else size * 1.25
    st = ParagraphStyle(
        "_hrspec_cell",
        fontName=font,
        fontSize=size,
        leading=ld,
        wordWrap="CJK",
    )
    safe = escape(text or "—", entities={"\"": "&quot;", "'": "&apos;"})
    return Paragraph(safe, st)


def build_hot_runner_spec_pdf(data: dict[str, Any]) -> bytes:
    """根据详情接口扁平 dict（含 *_label）生成 PDF 二进制。"""
    font = _ensure_cjk_font()
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
        title="热流道规格",
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "hrspec_title",
        parent=styles["Title"],
        fontName=font,
        fontSize=16,
        leading=20,
        spaceAfter=8,
    )
    meta_style = ParagraphStyle(
        "hrspec_meta",
        parent=styles["Normal"],
        fontName=font,
        fontSize=9,
        leading=12,
        spaceAfter=4,
        textColor=colors.HexColor("#595959"),
    )

    story: list[Any] = []
    story.append(Paragraph("模具热流道规格", title_style))

    mid = data.get("mold_number") or "—"
    mfg = data.get("mold_manufacturer") or "—"
    sid = data.get("id")
    sid_str = str(sid) if isinstance(sid, UUID) else (str(sid) if sid else "—")
    # 元数据每项独占一行，避免长文本挤在一行难以阅读
    story.append(Paragraph("模具编号：<b>" + escape(str(mid)) + "</b>", meta_style))
    story.append(Paragraph("制造商：" + escape(str(mfg)), meta_style))
    story.append(Paragraph("规格 ID：" + escape(sid_str), meta_style))
    ca = data.get("created_at")
    ua = data.get("updated_at")
    story.append(Paragraph("创建：" + escape(str(ca or "—")), meta_style))
    story.append(Paragraph("更新：" + escape(str(ua or "—")), meta_style))
    story.append(Spacer(1, 6 * mm))

    hdr = [_p("名称", font=font, size=10), _p("参数", font=font, size=10)]
    rows: list[list[Paragraph]] = [hdr]
    for label, key in HRSPEC_PDF_VALUE_KEYS:
        raw = data.get(key)
        if raw is None or raw == "":
            val = "—"
        else:
            val = str(raw)
        rows.append([_p(label, font=font), _p(val, font=font)])

    col_w = (doc.width - 4 * mm) * 0.28, (doc.width - 4 * mm) * 0.72
    tbl = Table(rows, colWidths=[col_w[0], col_w[1]], repeatRows=1)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fafafa")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d9d9d9")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(tbl)
    doc.build(story)
    return buf.getvalue()
