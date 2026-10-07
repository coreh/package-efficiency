def operation(input)
  path = input['path']
  held = 0
  freed = 0
  input['cycles'].times do
    a = File.open(path, File::RDWR | File::CREAT)
    a.flock(File::LOCK_EX)
    b = File.open(path, File::RDWR | File::CREAT)
    if b.flock(File::LOCK_EX | File::LOCK_NB)
      held += 1
      b.flock(File::LOCK_UN)
    end
    a.flock(File::LOCK_UN)
    if b.flock(File::LOCK_EX | File::LOCK_NB)
      freed += 1
      b.flock(File::LOCK_UN)
    end
    a.close
    b.close
  end
  [held, freed]
end
