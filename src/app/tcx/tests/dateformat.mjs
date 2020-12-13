/**
 * date and time format to string
 */

function timeToString(value) {
    const hours = Math.trunc(value / 3600);
    const minutes = Math.trunc((value - hours * 3600) / 60);
    const seconds = value - hours * 3600 - minutes * 60;
    return `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}`;
}

function dateToString(value) {
    const date = new Date(value);

    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = date.getFullYear();
    var hh = String(date.getHours()).padStart(2, '0');
    var nn = String(date.getMinutes()).padStart(2, '0');
    var ss = String(date.getSeconds()).padStart(2, '0');

    return `${dd}/${mm}/${yyyy} ${hh}:${nn}:${ss}`;
}

export {
    timeToString,
    dateToString
};

//___EOF___ date and time format
