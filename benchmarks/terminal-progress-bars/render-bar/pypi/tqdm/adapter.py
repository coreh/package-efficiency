from tqdm import tqdm


# An in-memory file: only the last non-blank write is remembered.
class Sink:
    last = ''

    def write(self, s):
        if s.strip():
            self.last = s

    def flush(self):
        pass


def operation(value):
    sink = Sink()
    with tqdm(total=value['total'], file=sink, mininterval=0, miniters=1, ncols=80) as bar:
        for _ in range(value['steps']):
            bar.update(1)
    return sink.last
