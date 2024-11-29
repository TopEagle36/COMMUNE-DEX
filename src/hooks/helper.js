const showFirstLastCh = (str, firstLen, lastLen) => {
    if (str == null) {
        return '';
    }
    if(str.length<=firstLen+lastLen){
        return str;
    }
    const firstChars = str.substring(0, firstLen);
    const lastChars = str.substring(str.length, str.length-lastLen);
    return `${firstChars}...${lastChars}`;

}

export {showFirstLastCh}