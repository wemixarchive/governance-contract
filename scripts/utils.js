


function largeToString(num){
    return num.toLocaleString('fullwid',{useGrouping:false});
}

module.exports = {largeToString}