// A tile is a single square on the game board. It can be empty or contain a piece.
// Some tiles have bonuses

import { Arrays } from "../common";

enum Bonus {
    DoubleLetter = "DoubleLetter",
    TripleLetter = "TripleLetter",
    DoubleWord = "DoubleWord",
    TripleWord = "TripleWord"
}

const BONUS_ABBREVIATIONS: Record<Bonus, string> = {
    [Bonus.DoubleLetter]: "2L",
    [Bonus.TripleLetter]: "3L",
    [Bonus.DoubleWord]: "2W",
    [Bonus.TripleWord]: "3W"
}

export const bonusAbbreviation = (bonus: Bonus): string => BONUS_ABBREVIATIONS[bonus]

enum Letter {
    A = "A",
    B = "B",
    C = "C",
    D = "D",
    E = "E",
    F = "F",
    G = "G",
    H = "H",
    I = "I",
    J = "J",
    K = "K",
    L = "L",
    M = "M",
    N = "N",
    O = "O",
    P = "P",
    Q = "Q",
    R = "R",
    S = "S",
    T = "T",
    U = "U",
    V = "V",
    W = "W",
    X = "X",
    Y = "Y",
    Z = "Z"
}

interface TileData {
    letter?: Letter;
    bonus?: Bonus;
}

interface BonusTileData extends TileData {
    bonus: Bonus;
}

function randomBonusTile(): BonusTileData {
    return {
        bonus: Arrays.chooseOne(Object.values(Bonus))
    }
}

function letterTile(letter: Letter): TileData {
    return { letter }
}

function letterTileFromChar(char: string): TileData {
    return letterTile(char[0] as Letter)
}

function emptyTile(): TileData {
    return {}
}

export type {
    TileData
}

export {
    Letter,
    Bonus,
    randomBonusTile,
    letterTile,
    letterTileFromChar,
    emptyTile
}