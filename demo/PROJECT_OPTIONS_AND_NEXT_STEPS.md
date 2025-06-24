# Vienna Photo Booth Project Documentation

## 1. Project Overview

### Business Idea
The Vienna Photo Booth is an artistic, retro-themed photo experience that transforms a vintage suitcase into a magical photo booth. The concept combines nostalgia with modern technology to create a unique, Instagram-worthy photography experience that feels like stepping back in time.

**The Artistic Concept:**
- A beautifully restored vintage suitcase serves as the photo booth enclosure
- The suitcase itself appears to be "taking" and "printing" photos, creating a magical illusion
- All modern technology (printer, camera/mobile phone, Raspberry Pi) is hidden inside the suitcase
- The exterior maintains the authentic retro aesthetic while the interior houses cutting-edge photo processing capabilities
- The result is a photo that looks like it was taken in a bygone era, complete with vintage frames and retro styling

**Target Market:**
- Wedding and celebration venues seeking unique entertainment
- Vintage-themed events and parties
- Art galleries and creative spaces
- Tourism destinations and historical venues
- Corporate events wanting memorable experiences
- Private parties and gatherings with artistic flair
- Instagram and social media-focused events

**Value Proposition:**
- **Unique Experience**: Unlike traditional photo booths, this creates a magical, artistic moment
- **Instagram-Worthy**: Perfect for social media sharing with retro aesthetic
- **Conversation Starter**: The suitcase concept generates curiosity and engagement
- **Versatile**: Can be themed for different events (vintage, steampunk, classic Hollywood)
- **Memorable**: Creates lasting memories with artistic, high-quality photos
- **Portable**: Easy to transport and set up at different venues

**The Magic:**
The suitcase appears to be alive - it "sees" through a hidden camera, "thinks" with the Raspberry Pi, and "creates" photos through the concealed printer. Guests are amazed when a vintage-styled photo emerges from what looks like an ordinary old suitcase. The experience feels like discovering a magical artifact from the past that still works perfectly.

## 2. Four Implementation Solutions

### Solution 1: Raspberry Pi + Mobile Phone (Current Implementation)

#### Technical Specification

**Description:**
This is the current implementation where a Raspberry Pi serves as the central server, connecting with printer, mobile phone and bluetooth button. The entire process is triggered by a wireless Bluetooth button. Raspberry reacts on click, connects to mobile phone via WebSocket and launches the One-Take Photo process that ends up printing the processed photo. 

**Key Features:**
- Real-time camera capture with mobile optimization
- Custom frame overlay system with smart placement algorithms
- Photo filters and effects (Normal, Black & White, Sepia, Old Camera)
- Professional printing integration with CUPS
- Comprehensive gallery and file management
- System monitoring and health checks
- Automatic file cleanup and storage management
- Wireless Bluetooth button trigger for hands-free operation

**Hardware Requirements:**
- Smartphone (iOS or Android) mounted inside suitcase
- Raspberry Pi 4 (recommended)
- CUPS-compatible printer
- Network connectivity (WiFi or Ethernet)
- Power supply for Raspberry Pi and printer
- Wireless Bluetooth button for photo capture trigger

**Software Stack:**
- **Server**: Raspberry Pi OS (Linux-based)
- **Backend**: Node.js with Express.js framework, PM2 for process management
- **Image Processing**: ImageMagick, Sharp libraries for high-quality image manipulation
- **Printing**: CUPS integration for professional printing capabilities
- **Frontend**: HTML5, CSS3, JavaScript with responsive design
- **Camera Access**: WebRTC getUserMedia API for real-time camera capture
- **Security**: HTTPS support with SSL certificates for mobile camera access
- **Bluetooth Trigger**: Wireless button connected to Raspberry Pi for photo capture initiation

**Workflow:**
1. User presses wireless Bluetooth button to start photo session
2. Raspberry Pi receives button signal and activates photo booth mode
3. Mobile phone mounted in suitcase has web browser with Vienna Photo Booth application pre-loaded
4. Pi sends command to mobile phone to initiate "one-take photo" mode
5. Mobile phone camera captures photo automatically through web browser
6. Photos are processed on the Raspberry Pi with frames and filters
7. Processed photos are printed via CUPS printer
8. Photos are stored in the gallery for later access

**What else left?**
1. Bluetooth button integration for raspberry PI (so RPI will always listen for a click)
2. WebSocket integration for vienna photo booth web app opened on mobile phone + raspberry PI
3. When receiving button click event, send event to mobile phone via websocket. When mobile phone receives event, it triggers One-Take Photo process
4. Ensure printer management and integration works as expected
5. [OPTIONAL] Setup wifi hotspot on raspberry pi so all devices will be connected through that network

#### Pros & Cons

**Плюси:**
- **Не потрібна камера**: Будь-який телефон підійде, головне щоб була камера
- **Багато можливостей кастомізації**: Можна додавати свої темплейти, фільтри і робити це все динамічно через веб-сайт
- **Live Менеджмент**: Raspberry Pi буде служити як севрер з адмінкою, і до нього можно буде підключитися будь-яка кількість будь-яких девайсів (наприклад і телефон і ноутбук одночасно). Менеджмент і зберігання темплейтів, фото, фільтрів та інших налаштувань стає дуже легким. З будь-якого девайсу, прямо під час робити з клієнтами (якщо вони захочуть іншу рамку або інший фільтр)
- **Віддалене керування Raspberry PI**: Якщо щось залагає або піде не так - достатньо перезавантажити raspberry pi через вебсайт
- **Можливість змінити підхід**: Якщо не підійде підхід з WiFi - усю техніку можна підключити до Raspberry Pi фізично, кабелями (хоча це і більш гєморно)

**Мінуси:**
- **Залежність від мобільного телефону**: Телефон завжди має бути увімкнений. На ньому завжди має бути запущений браузер з відкритим браузером у якому завжди відкритий веб-застосунок Vienn Photo Booth. Телефон не має спати чи повністю вимикати екран
- **Залежність від WiFi**: Щоб звʼязати Raspberry Pi з усіма девайсами, треба шоб вони усі були підключені до одноєї мережі WiFi. (слугувати як роутер і роздавати мережу може і сам Raspberry Pi, але це більше гємору, хоча можливо і дуже стабільно)
- **Raspberry Pi**: Треба купляти і налаштовувати Raspberry Pi (він працює від звичайного PowerBank, тому ще і це треба рахувати)

#### Final thoughts

Це той варіант який я "написав" (накидав). Демо того як це працює ти побачиш нижче у відосах.

Пару коментарів:
- Мені не подобається, що це веб-застосунок, а не мобільний застосунок. Мені ЗДАЄТЬСЯ, мобільний застосунок буде працювати краще, але без експерементів точно не сказати. Чого відразу не писав мобільний? Бо дуже і дуже гєморно симулювати прінтер, і сам процес розробки такого застосунку багато довший, а вільного часу в мене менше ніж я думав. Якщо правильно налаштувати телефон (щоб він не засипав і екран завжди працював) то і веб-застосунок буде працювати.
- Я не зробив інтеграцію Raspberry Pi з bluetooth кнопкою - навіть знаючи шо то за кнопка, я не можу її симулювати, потрібно фізічно мати тут.
- Прінтер я симулював, але дуже не надійно - може запросто не працювати коли підключиш свій прінтер.
- В моєму варіанті, усі пристрої мають бути підключенні до однієї WiFi мережі.
- Сам Raspberry Pi можна купити будь-де, ось приклад https://evo.net.ua/mikrokomputer-raspberry-pi-4-model-b-4gb/ (модель з 4гб нам ідеально підходить). Окрім цього тобі знадобиться MicroSD карта на 16гб (Raspbery Pi використовує MicroSD карти замість жорсткого диску).

Тому, підсумовуючи - тут ще треба зробити роботи, але це майже не можливо не будучи на місці і не маючи ті самі девайся для експериментів.
В цілому, це не найгірший, але і не найкращий варіант, але його треба дороблювати і тестувати. І для цього краще мати людину на місці, яка зможе з цим усім допомогати фізично.

Як передати цей варіант іншому розробнику?
1) передати розробнику посилання на сам репозиторій з кодом https://github.com/vitalishapovalov/vienna-photo-server
2) передати розробнику інформацію із секції "Business Idea"
3) передати розробнику інформацію із секції "Technical Specification" яка знаходиться у цьому розділі
4) зробити акцент на підсекції "What else left?" секції "Technical Specification"

Демо відео
1. [ДЕМО №1 Як виглядає сама коробка Raspberry Pi, як працює і запускається.](https://vimeo.com/1095972980/a1229133b3)
2. [ДЕМО №2 Як виглядає застосунок, як працює менеджмент прінтера, менеджмент темплейта (фрейма), інформація про статус сервера (коробку Raspberry Pi), де будуть лежати зроблені фото.](https://vimeo.com/1095973296/115686978c)
3. [ДЕМО №3 Як виглядає мануальний процес зйому (він знадобиться для тестування, налаштування). Вибір темплейту (фрейму), вибір фільтру, підтвердження та відправка результату на друк.](https://vimeo.com/1095973458/83077844cf)
4. [ДЕМО №4 Як буде виглядати РОБОЧИЙ процес, зйомка в один клік. Bluetooth кнопка буде запускати натискання цієї кнопки, і весь автоматизований процес буде розпочато і завершено в один клік.](https://vimeo.com/1095973657/65b75061f7)

### Solution 2: Mobile Phone Only Implementation

#### Technical Specification

**Description:**
A standalone mobile application that runs entirely on a smartphone mounted inside the suitcase, eliminating the need for a Raspberry Pi server. The photo capture is triggered by a wireless Bluetooth button connected to the phone.

**Hardware Requirements:**
- Smartphone (iOS or Android) mounted inside suitcase
- Portable printer (Bluetooth or WiFi-enabled)
- Wireless Bluetooth button for photo capture trigger

**Software Stack:**
- React Native or Flutter for cross-platform development
- Native camera APIs for photo capture
- Image processing libraries (Sharp.js, Canvas API)
- Bluetooth/WiFi printing libraries
- Local storage for photo management
- Bluetooth libraries for button integration

**Workflow:**
1. User presses wireless Bluetooth button connected to mounted phone
2. Mobile app receives button signal and activates camera automatically
3. App accesses device camera directly for photo capture
4. Photos are processed locally on the device
5. Frames and filters are applied using device processing power
6. Photos are printed via Bluetooth/WiFi printer
7. Photos are stored locally or synced to cloud storage

#### Pros & Cons

**Плюси:**
- **Не потрібна камера**: Будь-який телефон підійде, головне щоб була камера
- **Багато можливостей кастомізації**: Можна додавати свої темплейти, фільтри і робити це все динамічно черерз мобільний застосунок
- **Мінімалізм**: Телефон, прінтер, кнопка і все, більше нічого не потрібно

**Мінуси:**
- **Залежність від мобільного телефону**: Телефон завжди має бути увімкнений. На ньому завжди має бути запущений мобільний застосунок Vienn Photo Booth.
- **Залежність від Bluetooth**: Щоб звʼязати мобільний телефон з прінтером і кнопкою - треба буде використовувати Bluetooth, який деколи дає збій і буває нестабільним.
- **Відсутність віддаленого керування**: Якщо щось залагає або піде не так, або знадобиться змінити налаштування фільтрів чи рамки - треба буде лізти в сумку і клацати телефон

#### Final thoughts

Якщо коротко - цей варіант про те, що ми весь функціонал який тримав у собі Raspberry Pi засунемо у мобільний застосунок. Це треба повністю переписати абсолютно все що я писав.

Найбільший плюс - Не треба додаткової техніки окрім телефона.
Найбільший мінус - Нема можливості впливати на процес не залізаючи у коробку (якщо шось залагає під час зйомки, і прийдеться лізти у мобілку - це знищить магію ретро-чемодана).

Чого я відразу це не робив - після детального ресерчу я зрозумів, що нам все-таки більше підійде Андройд (бо там срали на безпеку застосунків, а це те що нам треба). А в мене нема засобів розробки (мені потрібен ноутбук з Linux або Windows) + девайсів для тестування, тому навіть не можу фізично почати.

Так само як і з минулим варіантом - тут краще щоб людина фізічно була на місці.

Як передати цей варіант іншому розробнику?
1) передати розробнику інформацію із секції "Business Idea"
2) передати розробнику інформацію із секції "Technical Specification" яка знаходиться у цьому розділі
4) (ОПЦІОНАЛЬНО) передати розробнику посилання на сам репозиторій з кодом https://github.com/vitalishapovalov/vienna-photo-server щоб він зрозумів вектор мислення

### Solution 3: Raspberry Pi + Digital Photo Camera

#### Technical Specification

**Description:**
A professional setup using a Raspberry Pi connected to a dedicated digital camera (DSLR or mirrorless) mounted inside the suitcase for high-quality photo capture. Photo sessions are initiated by a wireless Bluetooth button.

**Hardware Requirements:**
- Raspberry Pi 4 (recommended)
- Digital camera (DSLR or mirrorless) mounted inside suitcase
- Camera connection (USB, WiFi, or Bluetooth)
- CUPS-compatible printer
- Wireless Bluetooth button for photo capture trigger
- Optional: Camera mount and lighting setup

**Software Stack:**
- Raspberry Pi OS
- Node.js server application
- Camera control libraries (gphoto2, libgphoto2)
- Image processing with Sharp
- CUPS printing system
- Web interface for user interaction
- Bluetooth libraries for button integration

**Workflow:**
1. User presses wireless Bluetooth button to start photo session
2. Raspberry Pi receives button signal and activates camera system
3. Pi controls the digital camera mounted inside suitcase via software
4. Pi triggers camera capture remotely
5. High-quality photos are transferred to Pi for processing
6. Frames and filters are applied to professional-grade images
7. Processed photos are printed via CUPS printer
8. Photos are stored in gallery with metadata

#### Pros & Cons

**Плюси:**
- **Надійність!!!**: Камера набагато надійніше ніж мобільний телефон. Тому що телефон був зроблений не для фото, це лиша одна маленька функція. В той час як камера може цілий день бути зафіксованою в одній позиції і стабільно видивати якісні фотки однакового розміру
- **Багато можливостей кастомізації**: Можна додавати свої темплейти, фільтри і робити це все динамічно черерз мобільний застосунок
- **Live Менеджмент**: Raspberry Pi буде служити як севрер з адмінкою, і до нього можно буде підключитися будь-яка кількість будь-яких девайсів (наприклад і телефон і ноутбук одночасно). Менеджмент і зберігання темплейтів, фото, фільтрів та інших налаштувань стає дуже легким. З будь-якого девайсу, прямо під час робити з клієнтами (якщо вони захочуть іншу рамку або інший фільтр)
- **Віддалене керування Raspberry PI**: Якщо щось залагає або піде не так - достатньо перезавантажити raspberry pi через вебсайт

**Мінуси:**
- **Софт для керування камерою**: Написання софта для керування камерою (зробити фото і передати його на Raspberry Pi) може бути не найлегшою задачею, залежить від камери та метода підключення
- **Raspberry Pi**: Треба купляти і налаштовувати Raspberry Pi (він працює від звичайного PowerBank, тому ще і це треба рахувати)
- **Камера**: Треба купляти, налаштовувати і розбиватися з камерою
- **Складність підключення**: Треба звʼязати камеру з кнопкою по bluetooth, з камерою по кабелю, а з плінтером по wifi. Деколи може бути важко зрозуміти що саме у цьому ланцюзі зламалось чи пішло не так

#### Final thoughts

Цей варіант аналогічний першому, але замість телефону буде камера. Щоб адаптувати існуючий код до цього варіанту, треба буде дописати функціонал зйому фото через камеру яке буде запускати Raspberry Pi, і функціонал передачі цього фото з камери на Raspberry Pi. Це не найлегша задача, і як мінімум вимагає мати на руках усю техніку для експериментів.

Найбільший плюс - Надійність, бо камера багато надійніше телефону. Також усі плюси першого варіанту, бо адмінка і весь веб-застсоунок залишаються, за допомогою них можна буде менеджити процес і перезавантажувати у випадку лагів навіть не відкриваючи чемодан.
Найбільший мінус - Треба купити камеру, доглядати за нею і тд тп, це - окрема техніка.

Так само як і з минулим варіантом - тут краще щоб людина фізічно була на місці.

Як передати цей варіант іншому розробнику?
1) передати розробнику посилання на сам репозиторій з кодом https://github.com/vitalishapovalov/vienna-photo-server і пояснити що це може бути базою для проєкту
2) передати розробнику інформацію із секції "Business Idea"
3) передати розробнику інформацію із секції "Technical Specification" яка знаходиться у цьому розділі

### Solution 4: Mobile Phone + Printer with Terminal Simulation (existing implementation used by Venia)

#### Technical Specification

**Description:**
A lightweight solution using an Android phone mounted inside the suitcase that can simulate a terminal and execute bash commands through mobile apps. The phone runs Python/bash scripts to handle photo capture, processing, and printing, triggered by a wireless Bluetooth button.

**Hardware Requirements:**
- Android smartphone with terminal simulation capability mounted inside suitcase
- Portable printer (Bluetooth or WiFi-enabled)
- Wireless Bluetooth button for photo capture trigger

**Software Stack:**
- Terminal simulation app (Termux)
- Python/bash scripts for photo processing
- Image processing libraries (Pillow, OpenCV)
- Bluetooth/WiFi printing libraries
- Local storage for photo management
- Bluetooth libraries for button integration

**Workflow:**
1. User presses wireless Bluetooth button connected to mounted Android phone
2. Phone receives button signal and activates photo capture script
3. Python/bash script accesses device camera via terminal commands automatically
4. Photos are processed locally using Python image processing libraries
5. Frames and filters are applied using script-based processing
6. Photos are printed via Bluetooth/WiFi printer using script commands
7. Photos are stored locally with automated file management

#### Pros & Cons

**Плюси:**
- **Не потрібна камера**: Будь-який телефон підійде, головне щоб була камера
- **Мінімалізм**: Телефон, прінтер, кнопка і все, більше нічого не потрібно

**Мінуси:**
- **Відсутність віддаленого керування**: Якщо щось залагає або піде не так, або знадобиться змінити налаштування фільтрів чи рамки - треба буде лізти в сумку і клацати телефон
- **Залежність від мобільного телефону**: Телефон завжди має бути увімкнений. На ньому завжди має бути запущений мобільний застосунок який опрацьовує скріпти, спілкується з кнопкою та прінтером.
- **Нестабілність**: Комбінація скріптів, які запускають з різних застосунків, оперують різними девайсами і спілкуються між собою може бути дуже нестабільною. Особливо на Андройд телефоні. Можуть вилазити абсолютно неочікуванні проблеми будь-якого характеру (наприклад - може просто перестати бачити прінтер, хоча він буде відображатися як онлайн)
- **Відсутність кастомізації / відсутність інтерфейсу та адмінки**: Скріпти мають в собі дуже багато "хардкода" - який заточений під конкретну задачу. Крок вліво або вправо - і треба переписувати скріпти. Мова про динамічні рамки та фільтри, чи адмінку для менеджменту навіть не йде.

#### Final thoughts

Цей той варіант, який ти зараз використовуєш (не такий само, а такий який повинен в ідеалі бути). 

Цей варіант ОК для того щоб протестувати саму бізнес ідею і зробити один-два десятка фото. Але на майбутнє, я б рекомендував один з варіантів з raspberry pi.

Найбільший плюс - Мінімалізм, не треба ні камери, ні застосунків.
Найбільший мінус - Нестабільність. А реально, усі мінуси які описані вище.

Так само як і з минулим варіантом - тут краще щоб людина фізічно була на місці. Бо це вже не програмування, а автоматизація. І щоб звʼязати все одне ціле - симулювати не вийде, треба фізично мати всі, абсолютно ті самі девайси.

Як передати цей варіант іншому розробнику?
1) передати розробнику інформацію із секції "Business Idea"
2) передати розробнику інформацію із секції "Technical Specification" яка знаходиться у цьому розділі
3) передати всі свої існуючи скріпти і детальний алгоритм дій який ти вже викорстовуєш (включаючи назви програм і тд тп)

БОНУС

Я знайшов проблему того, чого твої скріпти фігово накладують темплейт - там не просто проблема з координатами, а з самою логікою.

Конкретне імʼя скріпту - `insert_and_print.sh`, я його переписав і додав декілька змін:
1) фото тепер вставляється в темплейт не по координатам, а воно динамічно шукає transparent (прозрачну) зону на темплейті, і акуратно підставляє туди фото
2) скріпт автоматично накладує black & white фільтр на фото
3) скріпт не заточений під конкретно той темплейт що ти дав, можна викорстовувати інші

Файлі які тобі треба оновити:
1) Я оновив твій темплейт, скачати можна тут (не забудь помістіти його у те саме місце з тим самим імʼям що і у попереднього) - [посилання](https://github.com/vitalishapovalov/vienna-photo-server/blob/main/demo/template.png), або просто збережи фото, або там є кнопка "Скачати" на інтерфейсі.
2) Також, сам оновлений скріпт знайти можна тут - [посилання](https://github.com/vitalishapovalov/vienna-photo-server/blob/main/demo/insert_and_print.sh), там є кнопка "Скачати" на інтерфейсі.

Як бачиш, тепер ти маєш використовувати тільки темплейти з transparent (прозрачною) зоною для вставки. Це тільки `.png` файли, можна самому такі робити в безкоштовному фотошопі онлайн (https://www.photopea.com/). 

## 3. Comparison Matrix

| Aspect | Pi + Mobile | Mobile Only | Pi + DSLR | Mobile + Terminal |
|--------|-------------|-------------|-----------|-------------------|
| **Cost** | Low-Medium | Low | High | Very Low |
| **Photo Quality** | Variable | Variable | High | Variable |
| **Setup Complexity** | Medium | Low | High | High |
| **Portability** | Medium | High | Low | Very High |
| **Reliability** | Medium | Medium | High | Low |
| **Scalability** | High | Low | Medium | Low |
| **Professional Appeal** | Medium | Low | High | Low |
| **Maintenance** | Low | Low | High | Medium |
| **Network Dependency** | High | None | Medium | None |
