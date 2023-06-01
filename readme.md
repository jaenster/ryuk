# Ryuk

Ryuk is a diablo 2 autoplay that tries to run a character from lvl 1 to high level. Fully written in typescript to have
less limitations of d2bs.

# What does it do

- new algorithm to walk
- other auto equipment system
- calculates runewords and decides what to make on what it finds and can
- it has basic testing (.test.ts) files to run in d2bs
- Run act 3 xp runs at lvl 20-24 (= quicker)
- I test it mostly on hardcore and it rarely dies
- It tries to handle big groups and packs of shamans and fallens and don't get stuck on it
- Mocks items and players, to calculate with items/skills it doesn't have

# Limitations

- Since d2bs runs on ancient javascript, maps and sets have no forEach functions. Which sucks because i like those
- All the focus went into a quick 20-24, after that its not that quick. It runs up to hell act 1
- It hits memory limits of d2bs from time to time

# Requirements to install

- nodejs to transpile typescript
- git
- blizzhackers/kolbot

# install

- Open the directory install, run install.cmd

# Does it edit my kolbot?

- No it only edits the `d2bs\kolbot\libs\config\_CustomConfig.js` file

# Bugs

I written this on a while back on a older version of kolbot, it bugs a bit on the improvements on kolbot made over time.

# D2bs

It uses a custom version of d2bs