const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
// Render ستقوم بتعيين المنفذ تلقائياً، هذا السطر يضمن التوافق
// Tell Express to trust the X-Forwarded-For header set by Render
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;

// هذا هو المسار الصحيح لملف البيانات
const testimonialsFilePath = path.join(__dirname, 'testimonials.json');

// Middlewares (برمجيات وسيطة)
app.use(cors()); // للسماح بالطلبات من واجهة الموقع
app.use(express.json()); // لتحليل البيانات القادمة بصيغة JSON
app.use(express.urlencoded({ extended: true })); // لتحليل البيانات من نموذج HTML

// 1. نقطة النهاية (API) لجلب كل آراء العملاء
app.get('/api/testimonials', (req, res) => {
    fs.readFile(testimonialsFilePath, 'utf8', (err, data) => {
        if (err) {
            // رسالة خطأ أوضح إذا لم يجد الملف
            console.error("خطأ: لا يمكن العثور على ملف 'testimonials.json' داخل مجلد 'server'. تأكد من وجود الملف.", err);
            return res.status(500).send('خطأ في قراءة بيانات آراء العملاء.');
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseError) {
            console.error("خطأ: ملف 'testimonials.json' يحتوي على صيغة JSON غير صالحة.", parseError);
            res.status(500).send('خطأ في تحليل بيانات آراء العملاء.');
        }
    });
});

// 2. نقطة النهاية (API) لإضافة رأي عميل جديد
app.post('/api/testimonials', (req, res) => {
    const newTestimonial = {
        id: Date.now(), // إضافة معرّف فريد لكل تعليق جديد
        name: req.body.name,
        message: req.body.message
    };

    // التحقق من أن البيانات ليست فارغة
    if (!newTestimonial.name || !newTestimonial.message) {
        return res.status(400).send('الاسم والرسالة مطلوبان.');
    }

    fs.readFile(testimonialsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("خطأ في قراءة الملف للحفظ:", err);
            return res.status(500).send('خطأ في قراءة البيانات.');
        }
        
        const testimonials = JSON.parse(data);
        testimonials.push(newTestimonial);

        fs.writeFile(testimonialsFilePath, JSON.stringify(testimonials, null, 2), (err) => {
            if (err) {
                console.error("خطأ في كتابة الملف:", err);
                return res.status(500).send('خطأ في حفظ البيانات.');
            }
            // بدلاً من إعادة التوجيه، سنرسل التعليق الجديد كـ JSON
            // هذا يسمح للواجهة الأمامية بإضافته للصفحة بدون إعادة تحميل
            res.status(201).json(newTestimonial);
        });
    });
});

// 3. نقطة النهاية (API) لحذف رأي عميل (محمية بـ IP)
app.delete('/api/testimonials/:id', (req, res) => {
    // =================================================================
    //      !!! كلمة المرور السرية لحذف التعليقات !!!
    //      يمكنك تغييرها إلى أي كلمة مرور تريدها
    // =================================================================
    const ADMIN_SECRET_KEY = 'admin123'; // <-- كلمة المرور هنا

    const providedSecret = req.headers['x-admin-secret'];

    console.log('محاولة حذف...');

    if (providedSecret !== ADMIN_SECRET_KEY) {
        console.log('رفض الطلب: كلمة المرور السرية غير صحيحة أو غير موجودة.');
        return res.status(403).send('غير مصرح لك بالقيام بهذه العملية.');
    }

    const testimonialId = parseInt(req.params.id, 10);

    fs.readFile(testimonialsFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('خطأ في قراءة البيانات.');
        }
        let testimonials = JSON.parse(data);
        // فلترة الآراء وإزالة الرأي الذي يطابق الـ ID المطلوب
        const updatedTestimonials = testimonials.filter(t => t.id !== testimonialId);

        fs.writeFile(testimonialsFilePath, JSON.stringify(updatedTestimonials, null, 2), (err) => {
            if (err) {
                return res.status(500).send('خطأ في حفظ البيانات بعد الحذف.');
            }
            res.status(200).send({ message: 'تم حذف الرأي بنجاح.' });
        });
    });
});

app.listen(port, () => {
    console.log(`السيرفر يعمل على http://localhost:${port}`);
});
