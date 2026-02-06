const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: 'صورة',
        version: '2.1',
        author: 'Hridoy',
        countDown: 20,
        prefix: true,
        groupAdminOnly: false,
        description: 'ينشئ صورة جميلة للمجموعة مع صور جميع الأعضاء.',
        category: 'group',
        guide: '{pn}',
    },
    onStart: async ({ api, event }) => {
        const { threadID } = event;
        const waitMessage = await api.sendMessage("جاري إنشاء صورة المجموعة، يرجى الانتظار...", threadID);

        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const { participantIDs, adminIDs, threadName } = threadInfo;

            const memberCount = participantIDs.length;
            const adminCount = adminIDs.length;

            const avatarSize = 120;
            const padding = 20;
            const headerHeight = 200;
            const footerHeight = 80;
            const sideMargin = 40;
            const nameHeight = 40;

            let avatarsPerRow;
            if (memberCount <= 8) avatarsPerRow = 4;
            else if (memberCount <= 20) avatarsPerRow = 5;
            else if (memberCount <= 35) avatarsPerRow = 6;
            else avatarsPerRow = 7;

            const numRows = Math.ceil(memberCount / avatarsPerRow);
            const avatarAreaWidth = avatarsPerRow * avatarSize + (avatarsPerRow - 1) * padding;
            const canvasWidth = Math.max(600, avatarAreaWidth + (sideMargin * 2));
            const canvasHeight = headerHeight + numRows * (avatarSize + nameHeight + padding) + footerHeight;

            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            // الخلفية
            const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
            gradient.addColorStop(0, '#1e3c72');
            gradient.addColorStop(0.3, '#2a5298');
            gradient.addColorStop(0.6, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.filter = 'blur(1px)';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.filter = 'none';

            // ترويسة
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvasWidth, headerHeight);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, canvasWidth, headerHeight);

            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(threadName || 'المجموعة', canvasWidth / 2, 80);

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            ctx.font = '22px Arial';
            ctx.fillStyle = '#E8E8E8';
            ctx.fillText(`${memberCount} أعضاء  |  ${adminCount} مشرفين`, canvasWidth / 2, 130);

            ctx.font = '16px Arial';
            ctx.fillStyle = '#CCCCCC';
            const now = new Date();
            const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
            ctx.fillText(`تم الإنشاء بتاريخ ${timestamp}`, canvasWidth / 2, 165);

            // تحميل معلومات المستخدمين والصور
            const userInfoPromises = participantIDs.map(id => 
                api.getUserInfo(id).then(info => ({ id, info: info[id] }))
            );

            const avatarPromises = participantIDs.map(id => 
                axios.get(`https://graph.facebook.com/${id}/picture?width=200&height=200&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })
                    .then(res => loadImage(res.data))
                    .catch(err => {
                        console.error(`فشل تحميل الصورة لـ ${id}:`, err.message);
                        return loadImage(path.join(__dirname, '..', '..', 'public', 'images', 'placeholder.png'));
                    })
            );

            const [userInfos, avatars] = await Promise.all([
                Promise.all(userInfoPromises),
                Promise.all(avatarPromises)
            ]);

            const startX = (canvasWidth - avatarAreaWidth) / 2;
            const startY = headerHeight + 20;

            for (let i = 0; i < avatars.length; i++) {
                const avatar = avatars[i];
                const userInfo = userInfos[i];
                const isAdmin = adminIDs.includes(userInfo.id);

                const row = Math.floor(i / avatarsPerRow);
                const col = i % avatarsPerRow;

                const x = startX + col * (avatarSize + padding);
                const y = startY + row * (avatarSize + nameHeight + padding);

                // دائرة المشرفين
                if (isAdmin) {
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                    ctx.beginPath();
                    ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2 + 12, 0, Math.PI * 2);
                    ctx.fill();
                
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }

                // الظل حول الصورة
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 5;

                ctx.strokeStyle = isAdmin ? '#FFD700' : 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = isAdmin ? 4 : 2;
                ctx.beginPath();
                ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
                ctx.stroke();

                // قص الصورة
                ctx.save();
                ctx.beginPath();
                ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                
                ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
                ctx.restore();

                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // اسم العضو
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                const userName = userInfo.info?.name || 'غير معروف';
                const truncatedName = userName.length > 12 ? userName.substring(0, 12) + '...' : userName;
                ctx.fillText(truncatedName, x + avatarSize / 2, y + avatarSize + 15);

                // علامة المشرف
                if (isAdmin) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = '10px Arial';
                    ctx.fillText('مشرف', x + avatarSize / 2, y + avatarSize + 30);
                }
            }

            // تذييل
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, canvasHeight - footerHeight, canvasWidth, footerHeight);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, canvasHeight - footerHeight, canvasWidth, footerHeight);

            // حفظ الصورة
            const cacheDir = path.join(__dirname, '..', 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const imagePath = path.join(cacheDir, `صورة_المجموعة_${threadID}.png`);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(imagePath, buffer);

            api.sendMessage({
                body: `تم إنشاء صورة المجموعة بنجاح!`,
                attachment: fs.createReadStream(imagePath)
            }, threadID, (err, msgInfo) => {
                fs.unlinkSync(imagePath);
                if (waitMessage && waitMessage.messageID) api.unsendMessage(waitMessage.messageID);
            });

        } catch (error) {
            console.error("خطأ في أمر إنشاء صورة المجموعة:", error);
            api.sendMessage("حدث خطأ أثناء إنشاء صورة المجموعة، حاول مرة أخرى لاحقاً.", threadID);
            if (waitMessage && waitMessage.messageID) api.unsendMessage(waitMessage.messageID);
        }
    },
};
