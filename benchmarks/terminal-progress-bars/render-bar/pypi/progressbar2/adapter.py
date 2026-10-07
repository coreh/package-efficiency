import progressbar


# An in-memory file: only the last non-blank write is remembered.
class Sink:
    last = ''

    def write(self, s):
        if s.strip():
            self.last = s

    def flush(self):
        pass

    def isatty(self):
        return True


def operation(value):
    sink = Sink()
    bar = progressbar.ProgressBar(max_value=value['total'], fd=sink, term_width=80)
    for i in range(value['steps']):
        bar.update(i + 1, force=True)
    return sink.last
