(function() {
    'use strict';
    var $ = {
        qs: function(s) {
            return document.querySelectorAll(s);
        },
        trigger: function(eventName, el) {
            if (document.createEvent) {
                var event = document.createEvent('HTMLEvents');
                event.initEvent(eventName, true, false);
                el.dispatchEvent(event);
            } else {
                var evt = document.createEventObject();
                return el.fireEvent('on'+eventName, evt);
            }
        },
        domReady: function(fn) {
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', fn);
            } else {
                var readyStateCheckInterval = setInterval(function() {
                    if (document.readyState === "complete") {
                        clearInterval(readyStateCheckInterval);
                        fn();
                    }
                }, 5);
            }
        },
        on: function(el, eventName, callback, context) {
            if (el.addEventListener) {
                el.addEventListener(eventName, function(event) {
                    callback.call(context, event);
                });
            } else {
                el.attachEvent('on' + eventName, function(event) {
                    callback.call(context, el);
                });
            }
        },
        each: function(array, fn) {
            for (var i = 0, l = array.length; i < l; i++) {
                fn(array[i], i);
            }
        },
        random: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    };

    var Countries = function() {
        //Активная страна выбранная пользователям

        //Проставляем текущую страну на основе GET
        this.userCountryCode = this.getCurrentCountry();

        //Nginx страна
        this.nginxCountryCode = this.getCurrentCountry();

        //Страна по умолчанию
        this.defaultCountry = null;

        //Параметры (по идее никогда не будут меняться)
        this.params = {
            countrySelector: '.country_select',
            mainPriceSelector: '.price_main',
            oldPriceSelector: '.price_old',
            phoneHelperSelector: '.phone_helper',
            nameHelperSelector: '.name_helper',

            cityCurrentHelperSelector: '.city-helper_current',
            cityRandomHelperSelector: '.city-helper_random',
            nameRandomMaleHelperSelector: '.name-helper_random-m',
            nameRandomFemaleHelperSelector: '.name-helper_random-f',
        };

        //Информация о странах
        this.countries = window.countryList;


        //Если js с странами подключился
        if (typeof this.countries === 'object') {
            //Обработка countries 
            this.prepareCountries();

            //Инитим ивенты
            this.initEvents();

            //Заполняем селекты стран, странами из объекта
            this.fillCountrySelect();

            //Выбираем активной страну в select на основе nginxCountryCode
            this.setActiveCountrySelect();

            // Проставляем в хелперы значения на основе активной страны
            this.fillPernamentHelpers();
        }

    };

    /**
     * Обработка countryList
     */
    Countries.prototype.prepareCountries = function() {
        //Выбираем страну по умолчанию
        for (var name in this.countries) {
            if (this.countries[name].isDefault === true) {
                this.defaultCountry = name;
                break;
            }
        }
    };

    /**
     * Простановка кода страны на основе GET параметра "c"
     */
    Countries.prototype.getCurrentCountry = function() {
        var locationSearch = window.location.search;

        if (locationSearch === "") return this.defaultCountry;

        var countryCode = locationSearch.match(/c\=([a-z]{2})/i);
        if (countryCode === null) {
            return this.defaultCountry;
        } else {
            return countryCode[1];
        }
    };

    /**
     * Инициализация событий
     */
    Countries.prototype.initEvents = function() {
        var _this = this,
            countrySelect = $.qs(this.params.countrySelector);

        if (countrySelect.length > 0) {
            for (var i = 0, l = countrySelect.length; i < l; i++) {
                // $.on(countrySelect[i], 'change', this.changeSelectCountry, this);
                countrySelect[i].onchange = function (event) {
                    _this.changeSelectCountry.call(_this, event);
                };
            }
        }
    };

    /**
     * Логика изменений страны
     * @param  {object} event window.event
     * @return {void}
     */
    Countries.prototype.changeSelectCountry = function(event) {
            event = event || window.event;
        var elem = event.currentTarget || event.srcElement,
            selectedCountryCode = elem.value,
            selectedCountry = this.countries[selectedCountryCode];

        this.userCountryCode = selectedCountryCode;

        //Основная цена
        $.each($.qs(this.params.mainPriceSelector), function(elem, index) {
            elem.innerHTML = '<span class="price_main_value">' + selectedCountry.price + '</span>' +
                '<span class="price_main_currency">' + selectedCountry.labelPrice + '</span>';
        });

        //Старая цена
        $.each($.qs(this.params.oldPriceSelector), function(elem, index) {
            elem.innerHTML = '<span class="price_main_value">' + selectedCountry.oldPrice + '</span>' +
                '<span class="price_main_currency">' + selectedCountry.labelPrice + '</span>';
        });

        //Телефонный хелпер
        if (selectedCountry.phoneHelper) {
            $.each($.qs(this.params.phoneHelperSelector), function(elem, index) {
                elem.innerHTML = selectedCountry.phoneHelper;
            });
        }
        //Именной хелпер
        if (selectedCountry.nameHelper) {
            $.each($.qs(this.params.nameHelperSelector), function(elem, index) {
                elem.innerHTML = selectedCountry.nameHelper;
            });
        }
    };

    Countries.prototype.fillPernamentHelpers = function() {
        var code = this.nginxCountryCode || this.defaultCountry;

        //Если nginxCountry отсутствует в countriesList устанавливаем default Country
        if (typeof this.countries[this.nginxCountryCode] === 'undefined') {
            code = this.defaultCountry;
        }

        var selectedCountry = this.countries[code];

        //Хелпер, отдающий текущий город
        if (selectedCountry.cityCurrentHelper) {
            this.updateCurrentCityHelper(selectedCountry.cityCurrentHelper);
        }
        //Хелпер, отдающий рандомный город
        if (selectedCountry.cityRandomHelper) {
            $.each($.qs(this.params.cityRandomHelperSelector), function(elem, index) {
                elem.innerHTML = selectedCountry.cityRandomHelper[$.random(0, selectedCountry.cityRandomHelper.length-1)];
            });
        }
        //Хелпер, отдающий рандомное мужское имя
        if (selectedCountry.nameRandomMaleHelper) {
            $.each($.qs(this.params.nameRandomMaleHelperSelector), function(elem, index) {
                elem.innerHTML = selectedCountry.nameRandomMaleHelper[$.random(0, selectedCountry.nameRandomMaleHelper.length-1)];
            });
        }
        //Хелпер, отдающий рандомное женское имя
        if (selectedCountry.nameRandomFemaleHelper) {
            $.each($.qs(this.params.nameRandomFemaleHelperSelector), function(elem, index) {
                elem.innerHTML = selectedCountry.nameRandomFemaleHelper[$.random(0, selectedCountry.nameRandomFemaleHelper.length-1)];
            });
        }
    };

    Countries.prototype.updateCurrentCityHelper = function(cityName) {
        $.each($.qs(this.params.cityCurrentHelperSelector), function(elem, index) {
            elem.innerHTML = cityName;
        });
    };

    /**
     * Заполняем селекты на лендинге странами из конфигурации
     */
    Countries.prototype.fillCountrySelect = function() {
        var country,
            newOption = function (country) {
                var option = document.createElement('OPTION');
                    option.value = country.code;
                    option.text = country.name;
                return option;
            },
            countrySelects = $.qs(this.params.countrySelector);


        if (countrySelects.length > 0) {
            for (var i = 0, l = countrySelects.length; i < l; i++) {
                if (countrySelects[i].nodeName === 'SELECT') {
                    for (var name in this.countries) {
                        country = this.countries[name];
                        countrySelects[i].options.add(newOption(country));
                    }
                }
            }
        }
    };

    /**
     * Проставляем value = countryCode в select_country
     */
    Countries.prototype.setActiveCountrySelect = function() {
        var countrySelects = $.qs(this.params.countrySelector);

        //Если нету nginx страны, вставляем defaultCountry
        var code = this.nginxCountryCode || this.defaultCountry;

        //Если nginxCountry отсутствует в countriesList устанавливаем default Country
        if (typeof this.countries[this.nginxCountryCode] === 'undefined') {
            code = this.defaultCountry;
        }

        if (countrySelects.length > 0) {
            for (var i = 0, l = countrySelects.length; i < l; i++) {
                countrySelects[i].value = code;
                $.trigger('change', countrySelects[i]);
            }
        }
    };

    //Стартуем логику на domReady
    $.domReady(function() {
        window.lCountries = new Countries();
    });

})();