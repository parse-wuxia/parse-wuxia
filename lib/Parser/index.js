const cheerio = require('cheerio');
const download = require('../Downloader');
const { createFile, readFile } = require('../Writer');
const template = require('./template');

const chunksCreator = (arr, n) => {
    var plen = Math.ceil(arr.length / n);
    return arr.reduce( function( p, c, i/*,  a */) {
      if(i%plen === 0) p.push([]);
      p[p.length-1].push(c);
      return p;
    }, []);
}

module.exports = class Parser {
    constructor({site, books}){
        this.site = site;
        this.books = books.map( bookName =>{
            return {
                        name:bookName,
                        chapters:[]
                    } 
        });
        this.url = this.site + '/novel/';
        this.uncreated = [];
        this.corrected = [];
    }
    async createBookIndex (bookName,bookID) {
        return new Promise(async resolve=>{
            //console.log(this, bookName);
            const bookUrl = this.url + bookName;
            const bookIndex = await download(bookUrl);
            const chapters = this.books[bookID].chapters;
            let toFile = '';
            const $ = cheerio.load(bookIndex);
            $('.panel-body').find('.chapter-item a').each((id, e)=>{
                chapters[id] ={
                    name: e.children.find(e=> e.name === 'span').children[0].data,
                    href:e.attribs.href.slice(1) + '.html',
                    url:e.attribs.href
                };
            });
            toFile+='<ul style="list-style-type: decimal;">\n';
            chapters.forEach((chapter)=>{
                toFile += `\t<li><a href="${chapter.href}">${chapter.name}</a></li>\n`;
            });
            toFile += `</ul>`;
            await createFile(`dist/${bookName}.html`, template(toFile) );
            resolve();
        });
        
    }
    async creatMainIndex(){
        const removeOldA = ($, bookName)=>{
            $('li > a').each(function(){
                //console.log($(this).text(),bookName);
                if($(this).text() === bookName){
                    $(this).parent().remove()
                }
            });
        };
        const index = await readFile('index.html');
        let $ = cheerio.load(index);
        if(!$('ul').length){
            $('div#root').append('<ul style="list-style-type: decimal;"></ul>');
        }
        this.books.forEach(({name})=>{
            removeOldA($, name);
            const a = `<li><a href="dist/${name}.html">${name}</a></li>`;
            $(a).appendTo('div#root > ul');
        });
       createFile('index.html', $.html());
    }
    createBooksIndexes(){
        return new Promise(async resolve=>{
            await  Promise.all( this.books.map(( {name}, id )=> this.createBookIndex(name, id) ) );
            resolve();
        });
    }
    makeChapter(body){
        const $ = cheerio.load(body);
        $('.panel.panel-default > div:first-child > .fr-view').find('a').each(function(){
            let new_href = '';
            const href = $(this).attr('href');
            if(!href){
               new_href = '#';
               console.log('href', $(this).html() ); 
            }else{
                new_href = href.slice(1) + '.html';
                new_href = new_href.split('/')[2];
            }
            $(this).attr("href", new_href);  
        });
        const file = $('.panel.panel-default > div:first-child > .fr-view');
        return file;
    }
    downloadChapters(chapters, chunkID){
        const that = this;
        return new Promise(resolve=>{
            let uncreated = 0;
            const recurs = async function fn(id){
                if( !chapters[id] ){
                    console.log('chunk '+ chunkID +' is end.', {chunkID, uncreated, length:chapters.length});
                    resolve(chunkID);
                    return
                };
                const chapter = chapters[id];
                const {url, href} = chapter;
                let file = '';
                if(chapter.file){
                    file = chapter.file;
                }else{
                    const body = await download(that.site + url);
                    file = that.makeChapter(body);
                }
                const err = await createFile('dist/'+ href, template(file));
                if(err){
                    uncreated++
                    that.uncreated.push({...chapter, file});
                }else if(!err && chunkID === 'uncreated'){
                    that.corrected.push(id);
                }
                fn(id+1);
            }
            recurs(0);
        });
    }
    downloadBooks(){
        const that = this;
        const recurs = async function fn(bookID){
            if(!that.books[bookID]) {
                return
            }
            console.log({bookID})
            await that.chunkChaptersDownloader(bookID);
            fn(bookID+1);
        };
        recurs(0);
    }
    chunkChaptersDownloader(bookID){
        return new Promise(async resolve=>{
            const {name, chapters} = this.books[bookID];
            console.log('start download chapters of ' + name + `(${chapters.length})`);
            const chunksLength = 16;
            
            const chunks = chunksCreator(chapters, chunksLength)
                  .map( (chap, chunkID)=> 
                        this.downloadChapters(chap, chunkID)
                  );
            console.log(chunks.length +' chunks is started');      
            await Promise.all(chunks);
            console.log('end download chapters of ' + name + `(${chapters.length})`);
            //await  this.isErr();
            resolve();
        });
    }
    isErr(){
        return new Promise(async resolve=>{
            if(this.uncreated.length){
                await this.downloadChapters(this.uncreated, 'uncreated');
                this.corrected.slice().forEach((c, id)=>{
                    this.uncreated.splice(c,1);
                    this.corrected.splice(id,1);
                });
                this.isErr(); 
            }else{
                resolve();
            }
        });
    }
}