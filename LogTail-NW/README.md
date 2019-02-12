export NWJS_BUILD_TYPE=sdk before installing nw SDK

for sqllite 3:
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
https://github.com/nodejs/node-gyp/issues/569

Building for node-webkit
on page: https://www.npmjs.com/package/sqlite3

npm install sqlite3 --build-from-source --runtime=node-webkit --target_arch=x64 --target=0.34.2


https://github.com/kriasoft/node-sqlite



https://stackoverflow.com/questions/32504307/how-to-use-sqlite3-module-with-electron