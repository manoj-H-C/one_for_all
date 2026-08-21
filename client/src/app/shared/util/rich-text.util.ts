/**
 * True when a Tiptap HTML value has no meaningful content - either genuinely
 * empty or just the lone empty paragraph ("<p></p>") the editor leaves
 * behind once every character has been deleted. Used so an emptied-out
 * description reads as "no description" (and saves as null) rather than as
 * a permanently "unsaved changes" state or a blank-looking read view.
 */
export function isBlankHtml(html: string | null | undefined): boolean {
  if (!html) return true;
  // these carry meaning with no text content of their own (an empty table
  // the user just inserted, an image, a divider) - stripping tags first
  // would wrongly read them as blank.
  if (/<(table|img|hr|iframe)\b/i.test(html)) return false;
  return !html.replace(/<[^>]*>/g, '').trim();
}
