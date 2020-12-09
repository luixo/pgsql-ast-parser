import {compile, keywords} from 'moo';
import { sqlKeywords } from './keywords';
export { LOCATION } from './syntax/ast';

// build keywords
const keywodsMap: any = {};
for (const k of sqlKeywords) {
    keywodsMap['kw_' + k.toLowerCase()] = k;
}
const caseInsensitiveKeywords = (map: any) => {
    const transform = keywords(map)
    return (text: string) => transform(text.toUpperCase())
}


// build lexer
export const lexer = compile({
    word: {
        match: /[eE](?!')[A-Za-z0-9_]*|[a-df-zA-DF-Z][A-Za-z0-9_]*/,
        type: caseInsensitiveKeywords(keywodsMap),
    },
    wordQuoted: {
        match: /"(?:[^"\*]|"")+"/,
        type: () => 'word',
        // value: x => x.substr(1, x.length - 2),
    },
    string: {
        match: /'(?:[^']|\'\')*'/,
        value: x => {
            return x.substr(1, x.length - 2)
                .replace(/''/g, '\'');
        },
    },
    eString: {
        match: /\b(?:e|E)'(?:[^'\\]|[\r\n\s]|(?:\\\s)|(?:\\\n)|(?:\\.)|(?:\'\'))+'/,
        value: x => {
            return x.substr(2, x.length - 3)
                .replace(/''/g, '\'')
                .replace(/\\([\s\n])/g, (_, x) => x)
                .replace(/\\./g, m => JSON.parse('"' + m + '"'));
        },
    },
    star: '*',
    comma: ',',
    space: { match: /[\s\t\n\v\f\r]+/, lineBreaks: true, },
    int: /\-?[0-9]+/,
    // word: /[a-zA-Z][A-Za-z0-9_\-]*/,
    commentLine: /\-\-.*?$[\s\r\n]*/,
    commentFull: /(?<!\/)\/\*(?:.|[\r\n])+\*\/[\s\r\n]*/,
    lparen: '(',
    rparen: ')',
    lbracket: '[',
    rbracket: ']',
    semicolon: ';',
    dot: '.',
    op_cast: '::',
    op_plus: '+',
    op_eq: '=',
    op_neq: {
        match: /(?:!=)|(?:\<\>)/,
        value: () => '!=',
    },
    op_minus: /(?<!\-)\-(?!\-)(?!\>)/,
    op_div: /(?<!\/)\/(?!\/)/,
    op_like: /(?<!\!)~~(?!\*)/, // ~~ =LIKE
    op_ilike: /(?<!\!)~~\*/, // ~~* =ILIKE
    op_not_like: /\!~~(?!\*)/, // !~~ =LIKE
    op_not_ilike: /\!~~\*/, // !~~* =ILIKE
    op_mod: '%',
    op_exp: '^',
    op_member: /\-\>(?!\>)/,
    op_membertext: '->>',
    op_additive: {
        // group other additive operators
        match: ['||', '-', '#-', '&&'],
    },
    op_compare: {
        // group other comparison operators
        // ... to add: "IN" and "NOT IN" that are matched by keywords
        match: ['>', '>=', '<', '<=', '@>', '<@', '?', '?|', '?&'],
    },
});

lexer.next = (next => () => {
    let tok;
    while ((tok = next.call(lexer)) && (tok.type === 'commentLine' || tok.type === 'commentFull' || tok.type === 'space')) {
    }
    return tok;
})(lexer.next);

export const lexerAny: any = lexer;