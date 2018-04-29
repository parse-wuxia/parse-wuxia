const Parser = require('./Parser');
const cheerio = require('cheerio');
const download = require('./Downloader');
const fs = require('fs');


const SITE = 'https://www.wuxiaworld.com';
const comleted = '/tag/completed';
let BOOKS = [ 
    '7-killers',
    'acquiring-talent-in-a-dungeon',
    'battle-through-the-heavens',
    'blue-phoenix',
    'breakers',
    'child-of-light',
    'coiling-dragon',
    'desolate-era',
    'dragon-king-with-seven-stars',
    'emperor-of-solo-play',
    'god-of-crime',
    'heros-shed-no-tears',
    'tymyd',
    'i-shall-seal-the-heavens',
    'im-sorry-for-being-born-in-this-world',
    'legends-of-ogre-gate',
    'overthrowing-fate',
    'praise-the-orc',
    'seoul-stations-necromancer',
    'skyfire-avenue',
    'stellar-transformations',
    'warlock-of-the-magus-world' 
];

const findCompletedBooks = ()=>{
    return new Promise(async resolve=>{
        const page = await download(SITE + comleted);
        const $ = cheerio.load(page);
        const books = [];
        $('.media-list.genres-list').find('.media').each(function(){
            const href = $(this).find('.media-body > .media-heading > a.text-white').attr('href');
           
            const name = href.split('/')[2];
            //console.log(href, name);
            books.push(name);
        });
        resolve(books);
    })
}
const createDirectory = (books)=>{
    return new Promise(resolve=>{
        books.forEach((book)=>{
            const dir = 'dist/novel/' + book;
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
        });
        const id = setInterval(()=>{
            let count = 0;
            books.forEach((book)=>{
                const dir = 'dist/novel/' + book;
                if (fs.existsSync(dir)){
                    count++;
                }
            });
            if(count === books.length){
                resolve()
                clearInterval(id);   
            }
        }, 1000);
    });
   
}
const start = async ()=>{
    BOOKS = await findCompletedBooks();
    console.log(BOOKS);
    const parser = new Parser({site:SITE, books:BOOKS});
    parser.creatMainIndex();
    //await parser.createBooksIndexes();
    
    //await createDirectory(BOOKS);

    //parser.downloadBooks();
}

start();