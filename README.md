软件开发之路

#生成密钥和公钥

```
mkdir config
cd config
openssl
grenrsa -out private.key 4096
rsa -in private.key -pubout -out public.key
exit
```
