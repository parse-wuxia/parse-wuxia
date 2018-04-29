const Parser = require('./Parser');
//const Writer = require('./Writer');

const SITE = 'https://www.wuxiaworld.com';

const BOOKS = [
    'rmji',
    'warlock-of-the-magus-world',
    'stellar-transformations',
    'martial-god-asura',
    'tales-of-demons-and-gods'
];


const start = async ()=>{
    const parser = new Parser({site:SITE, books:BOOKS});
    parser.creatMainIndex();
    //await parser.createBooksIndexes();
    //parser.downloadBooks();
}

start();