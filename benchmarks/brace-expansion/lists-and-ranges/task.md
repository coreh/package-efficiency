# Brace expansion of lists and ranges

One operation expands one brace pattern string into the list of strings it
stands for, in the order bash produces them (leftmost brace group varies slowest).
The 48 cases mix literal prefixes and suffixes, comma lists, nested comma
lists, several groups in one pattern, ascending numeric ranges such as `{1..12}`,
and ranges inside lists. Each result is a list of strings with between 2 and
a few hundred entries. The check compares the whole list, in order, with an
independent reference expander.

Inputs only use syntax every package treats the same way: no zero padding, no
steps, no descending or alphabetic ranges, no escapes, no empty alternatives and
no unbalanced or single-item braces. Packages run with their default settings
as installed. Each library's own list is the result; nothing is serialized
inside the measured call, and only the list length is read during measurement.

This is string expansion, not glob matching or filesystem walking.
