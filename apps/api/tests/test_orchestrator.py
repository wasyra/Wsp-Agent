from __future__ import annotations

import html
import re

from app.services.orchestrator import twiml_empty, twiml_message


def test_twiml_empty_is_valid_xml() -> None:
    xml = twiml_empty()
    assert "<Response" in xml
    assert "Message" not in xml


def test_twiml_message_escapes_html() -> None:
    xml = twiml_message("<b>hola</b>")
    assert "<b>" not in xml
    assert "&lt;b&gt;hola&lt;/b&gt;" in xml


def test_twiml_message_truncates_long_text() -> None:
    long_text = "x" * 2000
    xml = twiml_message(long_text)
    inner = re.search(r"<Message>(.*?)</Message>", xml, re.DOTALL)
    assert inner is not None
    decoded = html.unescape(inner.group(1))
    assert len(decoded) == 1500
