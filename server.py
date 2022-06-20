#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date  : 2022/6/24 12:00 下午
# @File  : 
# @Author: 
# @Desc  : 后台接口，对Client的数据进行承接，操作neo4j数据库

import os
import time
from tkinter import N
import requests
import pymongo
from flask import Flask, request, jsonify, abort,redirect, send_from_directory
from config import SPIDER_URL, MONGO_HOST
from flask_cors import CORS
app = Flask(__name__,  static_url_path='/Client/src')
CORS(app, supports_credentials=True)

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Client", "src")

def mongo_insert(data, database='label', collection='tmall', clean_before_insert=False, only_clean=False):
    """
    插入数据到mongo中
    :param data: list
    :type data:
    :param clean_before_insert: 在插入之前，先清空数据
    :param only_clean: 只做清空操作，不做插入
    :return:
    :rtype:
    """
    client = pymongo.MongoClient(MONGO_HOST, 27017)
    db = client[database]
    # 选择哪个collections
    mycol = db[collection]
    #插入数据
    if clean_before_insert or only_clean:
        x = mycol.delete_many({})
        print(f"事先清除已有数据成功: 清除的collection是: {database}中的{collection}")
    if only_clean:
        print(f"清空完成")
    else:
        x = mycol.insert_many(data)
        print(f"插入成功，插入的id是{x}")

def mongo_read(database='label', collection='tmall'):
    """
    返回database中collection的所有数据
    :param database:
    :type database:
    :param collection:
    :type collection:
    :return:
    :rtype:
    """
    client = pymongo.MongoClient(MONGO_HOST, 27017)
    db = client[database]
    # 选择哪个collections
    mycol = db[collection]
    data = []
    for x in mycol.find():
        data.append(x)
    print(f"从mongo数据库{collection}中共搜索到所有数据{len(data)}条")
    return data

def tmall_spider(keyword="资生堂"):
    """
    # 爬取天猫数据
    # 每条数据的格式
      {
    "comments": "4036",
    "keyword": "手机",
    "month_sale": "1000",
    "price": "2699.00",
    "shop_img": "https://img.alicdn.com/bao/uploaded/i3/1748529144/O1CN01LgQhSG2HQ0O2bIjn6_!!0-item_pic.jpg",
    "shopname": "oppo平实专卖店",
    "title": "[12期免息]OPPO Reno7 opporeno7手机新款上市oppo手机官方旗舰店官网reon8新年红新机6pro5g 0ppo新品限量版",
    "url": "https://detail.tmall.com/item.htm?id\u003d661430579650\u0026skuId\u003d4941746075359\u0026user_id\u003d1748529144\u0026cat_id\u003d2\u0026is_b\u003d1\u0026rn\u003da6712d9ecfb018e21fcec9ea74237056"
    },
    :rtype:
    """
    headers = {'user-agent': "okhttp/3.10.0.1", 'content-type': "application/json;charset='utf-8'"}
    url = SPIDER_URL
    data = {
        'keyword': keyword
    }
    text = {}
    count = 0
    # 正确的结果是列表，如果是列表，那么就说明是没有获取爬取成功的的
    while isinstance(text, dict):
        response = requests.post(url, headers=headers, json=data, timeout=6)
        text = response.json()
        time.sleep(2)
        count += 1
        print(f"重试中, 重试第{count}次...,当前的结果是: {text}")
    if text:
        # 插入一条数据到到mongo数据库中
        data = [
            {
                "keyword": keyword,
                "result": text
            }
        ]
        mongo_insert(data)
    print(f"获取结果完成，返回数据:{len(text)}条, 插入到数据库成功")
    return text

def get_tmall_data(keyword="资生堂"):
    """
    获取天猫数据, 先尝试读取缓存，如果不存在，那么读取爬取接口
    :return:
    :rtype:
    """
    text = ""
    cached_data = mongo_read()
    for x in cached_data:
        if x['keyword'] == keyword:
            text = x['result']
    if not text:
        print(f"缓存中没有关键词为 {keyword} 的数据，开始从接口获取天猫数据")
        text = tmall_spider(keyword)
    else:
        print(f"使用的缓存数据，关键词为 {keyword}")
    data = []
    for idx, x in enumerate(text):
        one = {
            "id": idx,
            "category": "护肤",
            "goods_title": x["title"],
            "goods_price": float(x["price"]),
            "goods_sales": x.get("month_sale", 0),
            "goods_img": x["shop_img"],
            "shop_name": x["shopname"],
            "seller": x["shopname"],
            "cmt_num": int(x.get("comments",0)),  # 评论数量
        }
        data.append(one)
    return data


@app.route('/api/labeled', methods=['POST'])
def labeled_data():
    """
    接收前端传过来的标注好的数据
    """
    json_dict = request.get_json()
    print(f"收到了用户提交的数据{json_dict}")
    result = {'status': 200, 'message': 'success'}
    return jsonify(result)

@app.route('/api/goodslist', methods=['GET'])
def goodslist_data():
    """
    传给前端爬取获取的数据
    """
    args_dict = request.args
    keyword = args_dict.get('keyword')
    if not keyword:
        print(f"用户提交的关键字为空，请给一个关键字")
        result = {'status': 200, 'message': '请提供一个关键字', 'total': 0, 'limit': 0, 'data': []}
    else:
        print(f"收到了用户提交的数据{keyword}")
    data = get_tmall_data(keyword)
    result = {'status': 200, 'message': 'success', 'total':len(data), 'limit':48, 'data':data}
    return jsonify(result)


@app.route('/', methods=['GET'])
def index():
    """
    主页
    """
    return send_from_directory(root, 'goodslist.html')

@app.route("/ping", methods=['GET','POST'])
def ping():
    """
    测试
    :return:
    :rtype:
    """
    return jsonify("Pong")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2266, debug=True, threaded=True)