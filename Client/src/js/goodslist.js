
//接受搜索的参数
var keyword = decodeURI(location.search.substr(location.search.indexOf('=') + 1));
if (keyword.trim()) {
    $(".search-input").val(keyword.trim());
} else {
    $(".search-input").val('');
}

//  主页搜索功能
goodsSearch();

function goodsSearch() {
    $(".search-submit-btn").on("click", function() {
        if ($(".search-input").val().trim()) {
            return location.href = './goodslist.html?keyword=' + $(".search-input").val().trim();
        } else {
            return location.href = './goodslist.html';
        }
    });
    $(".search-input").on("keyup", function(e) {
        if (e.keyCode === 13) {
            if ($(".search-input").val().trim()) {
                return location.href = './goodslist.html?keyword=' + $(".search-input").val().trim();
            } else {
                return location.href = './goodslist.html';
            }
        }
    });
}

//商品分页功能
(function() {

    layui.use(['laypage', 'layer'], function() {
        var laypage = layui.laypage;
        var layer = layui.layer;

        var goodsItemsBox = document.getElementById('goodsItemsBox');
        var hotGoodsBox = document.getElementById('hotGoodsBox');

        //请求商品数据
        var goodsData = [];

        $.ajax({
            url: ':2266/api/goodslist',
            method: 'GET',
            data: {
                keyword: keyword
            },
            success: function(res) {
                if (res.status !== 200) {
                    layer.msg('请求商品数据失败：请联系管理员', {icon: 1});
                    console.log(res.message + "返回的状态码不是200");
                    return console.log(res.message);
                }
                goodsData = res.data;
                //渲染商品列表
                renderGoodsList(res.total, res.limit);
            },
            error: function(err) {
                layer.msg('接口请求失败：请联系管理员', {icon: 1});
                console.log("请求商品数据失败：" + err);
            }
        });
        if (goodsData.length === 0) {
            return;
        }

        //商品排序
        $(".sort-module .sort-btn").on("click", function() {
            $.each($(".sort-module .sort-btn"), function(index, item) {
                $(item).removeClass("activity");
            });
            $(".sort-module .sort-price").removeClass("activity");
            $(this).addClass("activity");


            //默认排序
            if ($(this).hasClass("sort-default-btn")) {
                $.ajax({
                    url: '/api/goodslist',
                    method: 'GET',
                    data: {
                        keyword: keyword
                    },
                    success: function(res) {
                        if (res.status !== 1) {
                            return console.log(res.message);
                        }
                        goodsData = res.data;
                        //渲染商品列表
                        renderGoodsList(res.total, res.limit);
                    }
                });

            }

            //按销量排序
            if ($(this).hasClass("sort-sales-btn")) {
                $.ajax({
                    url: '/api/goodslist/sales',
                    method: 'GET',
                    data: {
                        keyword: keyword
                    },
                    success: function(res) {
                        if (res.status !== 1) {
                            return console.log(res.message);
                        }
                        goodsData = res.data;
                        //渲染商品列表
                        renderGoodsList(res.total, res.limit);
                    }
                });
            }

            //按信用（保障金）排序
            if ($(this).hasClass("sort-credit-btn")) {
                $.ajax({
                    url: '/api/goodslist/credit',
                    method: 'GET',
                    data: {
                        keyword: keyword
                    },
                    success: function(res) {
                        if (res.status !== 1) {
                            return console.log(res.message);
                        }
                        goodsData = res.data;
                        //渲染商品列表
                        renderGoodsList(res.total, res.limit);
                    }
                });
            }

            //价格从低到高排序
            if ($(this).hasClass("sort-price-asc")) {
                $(".sort-module .sort-price").html($(this).text() + '<i class="iconfont icon-ai-arrow-down"></i>').addClass("activity");
                $.ajax({
                    url: '/api/goodslist/price_asc',
                    method: 'GET',
                    data: {
                        keyword: keyword
                    },
                    success: function(res) {
                        if (res.status !== 1) {
                            return console.log(res.message);
                        }
                        goodsData = res.data;
                        //渲染商品列表
                        renderGoodsList(res.total, res.limit);
                    }
                });
            }

            //价格从高到低排序
            if ($(this).hasClass("sort-price-desc")) {
                $(".sort-module .sort-price").html($(this).text() + '<i class="iconfont icon-ai-arrow-down"></i>').addClass("activity");
                $.ajax({
                    url: '/api/goodslist/price_desc',
                    method: 'GET',
                    data: {
                        keyword: keyword
                    },
                    success: function(res) {
                        if (res.status !== 1) {
                            return console.log(res.message);
                        }
                        goodsData = res.data;
                        //渲染商品列表
                        renderGoodsList(res.total, res.limit);
                    }
                });
            }


        });

        //根据价格区间排序
        $(".sort-module .price-submit-btn").on("click", function() {
            //获取价格区间的两个值
            var p1 = parseFloat($(".sort-module .input-price-filter1").val().trim());
            var p2 = parseFloat($(".sort-module .input-price-filter2").val().trim());

            //判断输入价格是否合法
            if (!p1 || !p2 || p1 > p2) {
                return layer.msg('请输入正确的价格区间！');
            }
            $.ajax({
                url: '/api/goodslist/price_range',
                method: 'GET',
                data: {
                    price1: p1,
                    price2: p2,
                    keyword: keyword
                },
                success: function(res) {
                    if (res.status !== 1) {
                        return console.log(res.message);
                    }
                    if (res.data.length > 0) {
                        goodsData = res.data;
                        //渲染商品列表
                        renderGoodsList(res.total, res.limit);
                    } else {
                        return layer.msg('没有查询到相应结果！')
                    }

                }
            });

        });


        //渲染商品列表函数
        function renderGoodsList(total, limit) {
            //渲染分页器
            laypage.render({
                elem: 'goodsPage',
                count: total,
                limit: limit,
                layout: ['prev', 'page', 'next', 'skip'],
                jump: function(obj, first) {
                    //渲染对应页的商品数目
                    var data = goodsData.slice((obj.curr - 1) * 48, obj.curr * 48);
                    var goodsArr = [];
                    var goodsStr = '';
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].goods_title.indexOf(keyword) !== -1) {
                            var reg = new RegExp(keyword, 'gi');
                            var goodsTitle = data[i].goods_title.replace(reg, '<span class="s-keyword">' + keyword + '</span>');
                        } else {
                            var goodsTitle = data[i].goods_title;
                        }

                        //商品模板, 添加checkbox, 参考layui的form模块, 判断checked是否加上
                        goodsStr = '<div class="goods-item"><input type="checkbox" id="'+data[i].id+'" lay-skin="primary" title="选择" ><div class="goods-pic-wrap"><a href="./item.html?id=' + data[i].id + '" target="_blank"><img src="' + data[i].goods_img + '" alt=""></a></div><div class="goods-info"><div class="line line1 clearfix"><div class="goods-price-box"><span>￥</span><strong class="goods-price">' + data[i].goods_price.toFixed(2) + '</strong></div><div class="pay-number">' + data[i].goods_sales + '人付款</div><div class="goods-service-icon"></div></div><div class="line line2 clearfix"><a href="./item.html?id=' + data[i].id + '" class="goods-title-dec" target="_blank">' + goodsTitle + '</a></div><div class="line line3 clearfix"><div class="goods-shop"><a href="./item.html?id=' + data[i].id + '" class="shop-link" target="_blank"><span class="shop-icon"></span><span class="shop-name">' + data[i].shop_name + '</span></a></div><div class="location">' + '广东 深圳' + '</div></div><div class="line line4 clearfix"><div class="shop-honors"><ul class="clearfix"></ul></div><div class="wangwang-icon"><a href="javascript:;"></a></div></div></div></div>';
                        goodsArr.push(goodsStr);
                    }
                    goodsItemsBox.innerHTML = goodsArr.join('');


                }
            });

            //显示总页数文本
            var pageTextDom = document.querySelector('.goods-page').querySelector('.layui-laypage-skip');
            var totalPageText = document.createTextNode('共 ' + Math.ceil(total / limit) + ' 页，');
            pageTextDom.insertBefore(totalPageText, pageTextDom.childNodes[0]);
        }

    });

    //用户选择的商品，提交到后台进行处理
    $("#btn_commit").on("click", function() {
        //获取选中的商品id，获取id为goodsItemsBox的div下的所有checkbox的状态
        var goodsIdArr = [];
        var goodsItemsBox = $("#goodsItemsBox > div > :checkbox");
        var goodsPictures = $("#goodsItemsBox > div > .goods-pic-wrap > a > img");
        var goodsPrice = $("#goodsItemsBox > div > .goods-info > .line1 > .goods-price-box > .goods-price");
        var goodstitle = $("#goodsItemsBox > div > .goods-info > .line2 > .goods-title-dec");
        var shopName = $("#goodsItemsBox > div > .goods-info > .line3 > div > a> .shop-name");
        // 收集所有选中的商品的图片，title，店铺名称信息
        var goodsSelected = [];
        goodsItemsBox.each(function(index, item) {
            if (item.checked) {
                goodsIdArr.push(item.id);
                var one = {
                    id: item.id,
                    img: goodsPictures[index].src,
                    title: goodstitle[index].innerText,
                    shopName: shopName[index].innerText,
                    price: goodsPrice[index].innerText
                }
                goodsSelected.push(one);
            }
        });
        //判断用户提交的商品个数时是否大于1，如果为空，则提示用户
        if (goodsIdArr.length < 1) {
            layer.msg('请选择商品！，选中的商品个数太少！',{icon:5});
            return;
        }
        // 获取用户提交的关联的商品的名称
        var productName = $("#product_name").val();
        var labelData = {
            productName: productName,
            keyword: keyword,
            goodsSelected: goodsSelected,
        }
        //发送数据到后台，地址是http://127.0.0.1:2266/api/labeled, 查看baseAPI
        $.ajax({
            url: ':2266/api/labeled',
            method: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ data: labelData }),
            dataType: 'json',
            success: function(res) {
                if (res.status !== 200) {
                    return console.log(res.message);
                }
                layer.msg('提交成功！', {icon: 1});
                // 清空搜索框和产品框
                $("#product_name").val('');
                $(".search-input").val('')
            },
            error : function(XMLHttpRequest, textStatus, errorThrown){
                console.log(textStatus);
                console.log(errorThrown);
                layer.msg('提交失败，请联系管理员', {icon: 2})
            }
        });
    });
})();


//获取指定范围的随机整数函数
function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}