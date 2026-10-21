// Iconos pixel art como cuadrícula de caracteres:
// '#' usa el color del texto; el resto de letras se mapean en PALETTE; '.' es transparente
export const PALETTE: Record<string, string> = {
  r: 'var(--work)',
  R: 'var(--work-dark)',
  g: 'var(--break)',
  w: 'var(--text)',
  b: 'var(--long)',
  B: 'var(--long-dark)',
  m: 'var(--muted)',
  y: 'var(--star)',
  Y: 'var(--star-dark)',
  k: 'var(--track)',
  K: 'var(--panel-2)'
}

export const ART = {
  tomato: [
    '...gg...',
    '..gggg..',
    '.rrggrr.',
    'rrrrrrrr',
    'rwrrrrrr',
    'rrrrrrrR',
    '.rrrrrR.',
    '..RRRR..'
  ],
  star: [
    '....y....',
    '....y....',
    '...yyy...',
    'yyyyyyyyy',
    '.yyyyyyY.',
    '..yyyyY..',
    '..yyYyY..',
    '.yyY.YYY.',
    '.yY...YY.'
  ],
  starEmpty: [
    '....k....',
    '....k....',
    '...kkk...',
    'kkkkkkkkk',
    '.kkkkkkK.',
    '..kkkkK..',
    '..kkKkK..',
    '.kkK.KKK.',
    '.kK...KK.'
  ],
  flame: [
    '...r....',
    '...rr...',
    '..rrr.r.',
    '.rrryrr.',
    '.rryyrr.',
    'rryyyyrr',
    'rryyyyrr',
    '.rryyrr.'
  ],
  minimize: ['.......', '.......', '.......', '.......', '.......', '#######', '#######'],
  close: ['##...##', '###.###', '.#####.', '..###..', '.#####.', '###.###', '##...##'],
  mini: ['########', '#......#', '#......#', '#...####', '#...####', '#...####', '########'],
  expand: ['#######', '#######', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
  play: ['#......', '##.....', '###....', '####...', '###....', '##.....', '#......'],
  pause: ['##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '##..##'],
  wave: [
    '......wwwww...',
    '....wwbbbbbw..',
    '...wbbbbbbbbw.',
    '..wbbbBBBbbbbw',
    '.wbbB....Bbbbw',
    '.wbw......bbbw',
    '..w.......bbbw',
    '.........bbbbw',
    '.ww....wbbbbbb',
    'wbbwwwbbbbbbbb',
    'BBBBBBBBBBBBBB'
  ],
  target: ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..'],
  gear: [
    '..#..#..',
    '.######.',
    '###..###',
    '.#....#.',
    '.#....#.',
    '###..###',
    '.######.',
    '..#..#..'
  ],
  reset: ['..###.#', '.#...##', '#...###', '#......', '#.....#', '.#...#.', '..###..'],
  skip: ['#...#..#', '##..##.#', '###.####', '########', '###.####', '##..##.#', '#...#..#']
} satisfies Record<string, string[]>

export type ArtName = keyof typeof ART
