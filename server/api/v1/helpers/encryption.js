import CryptoJS from 'crypto-js';
import { config } from 'dotenv';



config();

class Encrypt {    
    encrypt(string) {
       const _secretKey = process.env.SECRET_KEY;
        try {
            return CryptoJS.AES.encrypt(string, _secretKey).toString();
        } catch(err) {
            throw new Error(err);
        }
    }
    decrypt(encrypted) {
        const _secretKey = process.env.SECRET_KEY;
        return CryptoJS.AES.decrypt(encrypted, _secretKey).toString(CryptoJS.enc.Utf8);
    }
}

const encryption = new Encrypt();

export default encryption;