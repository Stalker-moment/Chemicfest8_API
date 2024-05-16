const fs = require('fs')


//import database 
const siswadb = '../db/siswa.json'

//read database
let siswaData = fs.readFileSync(siswadb, 'utf8')

//mencocokan nama siswa dengan nama yang diinputkan, output berupa persentase kemiripan nama
async function matchingSiswa(name){
    const thisSiswa = JSON.parse(siswaData)
    let matching = 0
    let result = []

    for (let i = 0; i < thisSiswa.length; i++){
        let thisName = thisSiswa[i].Nama
        let thisNameLength = thisName.length
        let nameLength = name.length
        let min = Math.min(thisNameLength, nameLength)
        let max = Math.max(thisNameLength, nameLength)

        for (let j = 0; j < min; j++){
            if (thisName[j] == name[j]){
                matching++
            }
        }

        let persentase = (matching / max) * 100
        let data = {
            nama: thisName,
            persentase: persentase
        }
        result.push(data)
    }
    console.log(result)
}

matchingSiswa('Andika');