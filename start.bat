@echo off
cd /d C:\Users\Samuel\Desktop\Inventory\inventory
pm2 start ecosystem.config.cjs
pm2 save
exit