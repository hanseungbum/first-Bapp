import React, { useState, useEffect, Fragment } from "react";
import QRCode from "qrcode.react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faWallet, faPlus, faArrowLeft, faAngleDown, faCheck,faSearch, faAngleRight, faAngleLeft} from "@fortawesome/free-solid-svg-icons";
import { getBalance, fetchCardsOf, getPriceOf, sellCardOf } from "./api/UseCaver";
import * as KlipAPI from "./api/UseKlip";
import * as KasAPI from "./api/UseKas";
import DatePicker, { CalendarContainer } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import _ from 'lodash';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./market.css";
import {
  Navbar,
  Dropdown,
  Alert,
  Container,
  Card,
  Nav,
  Form,
  Button,
  Modal,
  Row,
  Col,
  ButtonGroup,
  ToggleButton,
  Image,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import { MARKET_CONTRACT_ADDRESS } from "./constants";

const DEFAULT_QR_CODE = "DEFAULT";
const DEFAULT_ADDRESS = "0x00000000000000000000000000000";
function App() {
  const [nfts, setNfts] = useState([]); // {id: '101', uri: ''}
  const [myBalance, setMyBalance] = useState("0");
  const [myAddress, setMyAddress] = useState("0x00000000000000000000000000000");

  const [nft, setNft] = useState({ id: '1', uri: '' });

  // UI
  const [qrvalue, setQrvalue] = useState(DEFAULT_QR_CODE);
  const [tab, setTab] = useState("MARKET"); // MARKET, MINT, WALLET, DETAIL
  const [tabBefore, setTabBefore] = useState("MARKET"); // MARKET, MINT, WALLET, DETAIL, SELL
  const [mintTokenId, setMintTokenId] = useState("");
  const [mintImageUrl, setMintImageUrl] = useState("");
  const [mintCategory, setMintCategory] = useState("dining");
  const [mintName, setMintName] = useState("");
  const [mintTitle, setMintTitle] = useState("");
  const [mintDatetime, setMintDatetime] = useState("");
  const [mintDescription, setMintDescription] = useState("");
  const [mintPlace, setMintPlace] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  const [searchText, setSearchText] = useState("");
  const [categoryText, setCategoryText] = useState("????????????");
  const [filterText, setFilterText] = useState("?????????");

  const [walletDp, setWalletDp] = useState("WALLET");


  const categories = [
    { name: '?????????', value: 'dining' },
    { name: '?????? ?????????', value: 'class' },
    { name: '???????????? ??????', value: 'limited' }
  ];

  const [clickedCategory, setClickedCategory] = useState(0);
  const [clickedFilter, setClickedFilter] = useState(1);
  const [isCategory, setIsCategory] = useState(false);

  const [showCategory, setShowCategory] = useState(false);
  const [categoryModalProps, setCategoryModalProps] = useState({
    title: "MODAL",
    onConfirm: () => { },
  });

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState({
    title: "MODAL",
    onConfirm: () => { },
  });

  const rows = nfts.slice(nfts.length / 2);
  const fetchMarketNFTs = async () => {
    const _nfts = await fetchCardsOf(MARKET_CONTRACT_ADDRESS);
    for (var nft of _nfts) {
      const _price = await getPriceOf(nft.id);
      nft.price = _price / 1000000000000000000;
      nft.uri.categoryKor = _.filter(categories, (i) => {return i.value === nft.uri.category})[0].name;
      let dt = nft.uri.datetime;
      dt = _.replace(_.replace(_.replace(dt, '???', '-'), '???', '-'), '???', '-').split("-");
      let target = _.map(dt, (item) => {
        let i = item.trim();
        return i = ( Number(i < 10) && !(i.includes('0')) ) ? '0' + i : i;
      });
      
      nft.uri["datetimeFmt"] = `${target[1]}/${target[2]}`;

    }
    setNfts(_nfts);
  };

  const setSearch = async (searchText) => {
    debugger;
    const _nfts = await fetchCardsOf(MARKET_CONTRACT_ADDRESS);
    let _nft = _nfts;
    for (var nft of _nft) {
      const _price = await getPriceOf(nft.id);
      nft.price = _price / 1000000000000000000;
    }
    if (!categoryText.includes("??????") && !categoryText.includes("????????????")) {
      _nft = _nft.map(o =>
        (o.uri.category.includes(categories.find(o => o.name === categoryText).value) ? o : null)).filter(o => (o !== null));
    }

    if (searchText == '') {
      setNfts(_nft);
    } else {
      _nft = _nft.map((o, idx) => (o.uri.title.includes(searchText) ? o : null)).filter(o => (o !== null));
      setNfts(_nft);
    }


  };

  const fetchMyNFTs = async () => {
    if (myAddress === DEFAULT_ADDRESS) {
      alert("NO ADDRESS");
      return;
    }
    const _nfts = await fetchCardsOf(myAddress);
    _.map(_nfts, (i) => {
      i["categoryKor"] = _.filter(categories, (ctg) => {return ctg.value === i.uri.category})[0].name;
    })
    setNfts(_nfts);
  };

  const onClickMintButton = (image, name, category, title, datetime, description, place) => {
    setModalProps({
      title: "?????????????????????????",
      onConfirm: () => {
        setTabBefore("MINT")
        onClickMint(image, name, category, title, datetime, description, place);
      },
    });
    setShowModal(true);
  }

  const onClickMint = async (image, name, category, title, datetime, description, place) => {
    if (myAddress === DEFAULT_ADDRESS) {
      alert("NO ADDRESS");
      return;
    }

    const metadataURL = await KasAPI.uploadMetaData(image, name, category, title, datetime, description, place);
    if (!metadataURL) {
      alert("metadata upload fail")
      return;
    }

    // const randomTokenId = parseInt(Math.random() * 10000000);
    KlipAPI.mintCardWithURI(
      myAddress,
      mintTokenId,
      metadataURL,
      setQrvalue,
      (result) => {
        // alert(JSON.stringify(result));
        setTab("COMPLETE")
      }
    );
  };

  const onClickTransfer = (id) => {
    if (tab === "SELL") {
      if (sellPrice == "" || sellPrice <= 0) {
        alert("????????? ????????? ??????????????????.")
        return
      }
      setModalProps({
        title: "?????????????????????????",
        onConfirm: () => {
          onClickMyCard(id);
        },
      });
      setShowModal(true);
    }
    if (tabBefore === "WALLET") {
      setTab("SELL")
      setTabBefore("DETAIL")
    }
    if (tabBefore === "MARKET") {
      setModalProps({
        title: "?????????????????????????",
        onConfirm: () => {
          onClickMarketCard(id);
        },
      });
      setShowModal(true);
    }
  };

  const onClickMyCard = async (tokenId) => {
    await sellCardOf(tokenId, sellPrice);

    KlipAPI.listingCard(myAddress, tokenId, setQrvalue, (result) => {
      console.log(JSON.stringify(result));
      // alert("?????? ?????????????????????.")
      setTab("COMPLETE")
    });
  };

  const onClickMarketCard = async (tokenId) => {
    const price = await getPriceOf(tokenId)

    KlipAPI.buyCard(tokenId, price, setQrvalue, (result) => {
      console.log(JSON.stringify(result));
      // alert("?????? ?????????????????????.")
      setTab("COMPLETE")
    });
  };

  const showCategoryModal = (text) => {
    setCategoryModalProps({
      title: text,
      onConfirm: () => {
      },
    });
    setShowCategory(true);
  };

  const changeWalletDp = (dp) => {
    fetchMyNFTs();
    setWalletDp(dp);
  }


  const getUserData = () => {
    setModalProps({
      title: "Klip ????????? ?????????????????????????",
      onConfirm: () => {
        KlipAPI.getAddress(setQrvalue, async (address) => {
          setMyAddress(address);
          const _balance = await getBalance(address);
          setMyBalance(_balance);
        });
      },
    });
    setShowModal(true);
  };

  useEffect(() => {
    // getUserData();
    fetchMarketNFTs();
  }, []);
  return (
    <div className="App">
      <div style={{ padding: 10 }}>

        {tab === "WALLET" && walletDp === 'WALLET' ? (
        // {/* ?????? ?????? */}
        <Fragment>
          <div
              style={{
                backgroundColor: "#f5f5f5",
                minHeight: "110px",
                marginTop: "10%",
                padding: "10% 2%"
              }}
          >
            <div>
              <font style={{
                  fontSize: 20,
                  fontWeight: "bold", 
              }}
              >
                ??? ??????
              </font>
            </div>
            <div style={{padding: "0.5%",fontSize:"11px", color:"gray"}}>
              ${myAddress}
            </div>
            <div style={{
              padding: "0.5%",
              color:"#34cd75", fontSize:"20px", fontWeight:"600",
              display: "inline-block",
              whiteSpace: "nowrap",
              overflow : "hidden",
              textOverflow : "ellipsis"
            }}>
            {myAddress !== DEFAULT_ADDRESS
              ? `${myBalance} KLAY `
              : "?????? ?????? ??????"
            }
            </div>
          </div>
          <div style={{
            marginTop: "5%",
            width : "100%",
            display : "flex"
          }}
            onClick= {() => changeWalletDp('OWN')}
          >
             <span style={{ padding: "3%", width : "40%" }}>????????? ??????</span>
             <span style={{ padding: "3%", width : "60%" }}><FontAwesomeIcon color="gray" size="1x" icon={faAngleRight} /></span>
          </div>
          {/* <div style={{
            marginTop: "5%",
            width : "100%",
            display : "flex"
          }}
          onClick= {() => changeWalletDp('SELL')}
          >
             <span style={{ padding: "3%", width : "40%" }}>?????? ?????? ??????</span>
             <span style={{ padding: "3%", width : "60%" }}><FontAwesomeIcon color="gray" size="1x" icon={faAngleRight} /></span>
          </div> */}
        </Fragment>
        ) : null}

        {myAddress === DEFAULT_ADDRESS ? (
          // {/* ????????? ??? ?????? (?????? ????????????) */}
          <div style={{ textAlign: 'center', marginTop: 250, paddingRight: 10 }}>
            <img src="drawable-mdpi/frame_79.png" style={{ width: 75, height: 74 }} /><br /><br />
            <img src="drawable-mdpi/dine.png" style={{ width: 52, height: 18 }} /><br /><br />
            <p>NFT??? ???????????? ????????? ?????????</p><br /><br />
            <Button
              onClick={getUserData}
              variant={"balance"}
              style={{ backgroundColor: "#000000", color: '#FFFFFF', fontSize: 25, textAlign: "center", width: 340 }}
            >?????????
            </Button>
          </div>
        ) : null}

        {/* ????????? ??? ?????? ?????? */}
        {myAddress !== DEFAULT_ADDRESS && tab === "MARKET" ? (
          <>
            <Container>
              <img src="drawable-hdpi/dine.png" style={{ width: 52, height: 18 }} /><br /><br />
            </Container>
            <Container>
              <Row>
                <Col xs={12} md={8}>
                  <img src="drawable-hdpi\invalid_name.png" style={{ width: 200, height: 50 }} /><br /><br />
                  <img src="drawable-xxhdpi\rectangle_429.png" style={{ position: "absolute", top: 100, width: 200, height: 10 }} /><br /><br />
                </Col>
                <Col xs={6} md={4}>
                  <img src="drawable-xxxhdpi\frame_80.png" style={{ width: 100, height: 70 }} /><br /><br />
                </Col>
              </Row>

            </Container>
            <Container>
              <>
                <InputGroup className="mb-3">
                  {/* <Form className="d-flex" value={searchText}> */}
                  <FormControl
                    value={searchText}
                    placeholder="???????????? ????????? ?????????."
                    type="text"
                    style={{ fontWeight: "bold", width: 200, backgroundColor: "lightgray", marginRight: "5px" }}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                    }}
                  />
                  <Button
                    variant="outline-secondary"
                    // size="sm"
                    onClick={() => { setSearch(searchText) }}
                    style={{ width: 70, }}
                  >
                    <FontAwesomeIcon
                      color="black"
                      size="1x" icon={faSearch}
                      style={{ width: 50 }}
                    />
                  </Button>
                  {/* </Form> */}
                </InputGroup>
              </>
            </Container>
            <Navbar>
              <Container>
                <Navbar.Text style={{ fontSize: "large", fontWeight: "bold", color: "black" }} >
                  Market
                </Navbar.Text>
                <Navbar.Collapse className="justify-content-end">
                  <Button
                    size="sm"
                    style={{ width: "50%", fontWeight: "bold" }}
                    onClick={() => {
                      showCategoryModal("????????????");
                      setIsCategory(true);
                    }} variant="category" >
                    {categoryText}
                    {'  '}
                    <FontAwesomeIcon color="black" size="lg" style={{ width: "20%" }} icon={faAngleDown} />
                  </Button>
                  {'  '}
                  <Button size="sm"
                    style={{ width: "50%", fontWeight: "bold" }}
                    onClick={() => {
                      showCategoryModal("??????");
                      setIsCategory(false);
                    }} variant="category" >
                    {filterText}
                    {'  '}
                    <FontAwesomeIcon color="black" size="lg" style={{ width: "20%" }} icon={faAngleDown} />
                  </Button>
                </Navbar.Collapse>
              </Container>
            </Navbar>
          </>

        ) : null}

        {/* ?????????(??????, ??? ??????) */}
        {myAddress !== DEFAULT_ADDRESS && (tab === "MARKET"|| (tab === "WALLET") && (walletDp === 'OWN' || walletDp === 'SELL')) ? (

          <Fragment>
          {tab === "WALLET" && (walletDp === 'OWN' || walletDp === 'SELL') ? 
            <Fragment>
              <div style={{ marginTop: "5%", display : "flex" }}   onClick={() => {
                setTab("WALLET");
                setWalletDp("WALLET");
                fetchMyNFTs();
                setQrvalue("DEFAULT")
              }} >
                <span style={{ padding: "3%"}}><FontAwesomeIcon color="gray" size="lg" icon={faAngleLeft} /> </span>
              </div>
                
          </Fragment>
          : ''}

          <div className="container" style={{ padding: 0, width: "100%" }}>
            {rows.map((o, rowIndex) => (
              <>
                <Row key={`rowkey${rowIndex}`}>
                  <Col style={{ marginRight: 0, paddingRight: 0, width: "50%" }}>

                    <Card
                      onClick={() => {
                        tab === "MARKET" ? setTabBefore("MARKET") : setTabBefore("WALLET")
                        setTab("DETAIL")
                        setNft(nfts[rowIndex * 2])
                      }}
                    >
                      <Card.Img src={nfts[rowIndex * 2].uri.image} />

                        <div class="jb-image">
                          <img src="drawable-hdpi/frame_6.png" style={{width:45, height:16}}/>
                        </div>
                        <div class="jb-text">
                            <p>{nfts[rowIndex * 2 ].uri.datetimeFmt}</p>
                        </div>
                        

                      <Card.Text
                        style={{ fontSize: 15, float: "left", fontWeight: "bold" }}
                      >
                        {nfts[rowIndex * 2].uri.title}
                      </Card.Text>


                      {tab === "MARKET" ?

                        <Card.Text
                          style={{ fontSize: 12, float: "left", fontWeight: "bold", color: "green" }}
                        >
                          {nfts[rowIndex * 2].price} KLAY
                        </Card.Text>
                        : null}

                      <Card.Text
                        style={{ fontSize: 12, float: "left", color: "gray" }}
                      >
                        {categories.find(o => o.value === nfts[rowIndex * 2].uri.category).name}
                        {' '} - {nfts[rowIndex * 2].uri.shop_name}
                      </Card.Text>

                    </Card>

                  </Col>

                  <Col style={{ marginRight: 0, paddingRight: 0, width: "50%" }}>
                    {nfts.length > rowIndex * 2 + 1 ? (
                    <Card
                    onClick={() => {
                      tab === "MARKET" ? setTabBefore("MARKET") : setTabBefore("WALLET")
                      setTab("DETAIL")
                      setNft(nfts[rowIndex * 2])
                    }}
                  >
                    <Card.Img src={nfts[rowIndex * 2+1].uri.image} />

                    <div class="jb-image">
                          <img src="drawable-hdpi/frame_6.png" style={{width:45, height:16}}/>
                        </div>
                        <div class="jb-text">
                            <p>{nfts[rowIndex * 2 + 1 ].uri.datetimeFmt}</p>
                        </div>


                    <Card.Text
                      style={{ fontSize: 15, float: "left", fontWeight: "bold" }}
                    >
                      {nfts[rowIndex * 2+1].uri.title}
                    </Card.Text>


                    {tab === "MARKET" ?

                      <Card.Text
                        style={{ fontSize: 12, float: "left", fontWeight: "bold", color: "green" }}
                      >
                        {nfts[rowIndex * 2+1].price} KLAY
                      </Card.Text>
                      : null}

                    <Card.Text
                      style={{ fontSize: 12, float: "left", color: "gray" }}
                    >
                      {categories.find(o => o.value === nfts[rowIndex * 2+1].uri.category).name}
                      {' '} - {nfts[rowIndex * 2+1].uri.shop_name}
                    </Card.Text>

                  </Card>
                    ) : null}
                  </Col>
                </Row>
              </>
            )

            )}
          </div>
         </Fragment>
        ) : null}

        {/* ?????? ????????? */}
        {myAddress !== DEFAULT_ADDRESS && tab === "DETAIL" ? (
          <div className="container" style={{ padding: 0, width: "100%" }}>
            <div onClick={() => {
              setTab(tabBefore)
            }}>
              <FontAwesomeIcon color="black" size="lg" icon={faArrowLeft} style={{ width: 20 }} />
            </div>
            <div><Image src={nft.uri.image} /></div><br/>
            <div className="nftDetailContent">
              <div style={{color:"#2d2d2d", fontSize:"25px", fontWeight:"600", marginBottom:"5%"}}> {nft.uri.title}</div>
              <div style={{display:"flex", justifyContent:"space-between"}}>
                 <div> ??? { nft.uri.shop_name} </div> 
                 <div style={{color:"#34cd75", fontSize:"15px", fontWeight:"600", textAlign:"right"}}> {nft.price} KLAY ~</div>
              </div>
              <div className="borderLine"></div>

              <div><label className="detailLb">????????????</label><span className="detailCont">{nft.uri.description}</span></div>
              <div><label className="detailLb">????????????</label><span className="detailCont"><span className="detailCont">{ nft.uri.categoryKor || '??????'} </span></span></div>
              <div><label className="detailLb">??????</label><span className="detailCont">{nft.uri.place}</span></div>
              <div className="borderLine"></div>

              <div style={{color:"#000000", fontSize:"20px",  fontWeight:"600", marginTop:"2%"}}> ???????????? </div>

                <div style={{color:"#2d2d2d", fontSize:"14sp"}}><label className="detailLb">?????????</label><span className="detailCont">{nft.uri.datetime}</span></div>
                <div style={{color:"#2d2d2d", fontSize:"14sp"}}><label className="detailLb">??????ID</label><span className="detailCont">{nft.id}</span></div>
                <div style={{color:"#2d2d2d", fontSize:"14sp"}}><label className="detailLb">???????????? ??????</label><span className="detailCont">{MARKET_CONTRACT_ADDRESS}</span></div>
            </div>
            <Button
              onClick={() => {
                onClickTransfer(nft.id);
              }}
              variant="primary"
              style={{
                backgroundColor: "#000000",
                borderColor: "#000000",
              }}
            >
              {tabBefore === "MARKET" ? "????????????" : "????????????"}
            </Button>
          </div>
        ) : null}

        {/* ?????? ????????? */}
        {myAddress !== DEFAULT_ADDRESS && tab === "SELL" ? (
          <div className="container" style={{ padding: 0, width: "100%" }}>
            <div onClick={() => {
              setTab(tabBefore)
              setTabBefore("WALLET")
            }}>
              <FontAwesomeIcon color="black" size="lg" icon={faArrowLeft} style={{ width: 20 }} />
            </div>
            <div className="nftSellContent">
              <div style={{marginTop:"20%"}}>
                {/* <span style={{fontWeight: "600", fontSize: "20px",}}>????????? ????????? ??????????????????</span> */}
              </div>
              <div>
              <Form>
                <span style={{fontSize:"18px", fontWeight:"bold"}}>?????? ??????</span><br/><br/>
                <InputGroup className="mb-3">
                  <FormControl
                    value={sellPrice}
                    placeholder="0"
                    type="number"
                    onChange={(e) => {
                      setSellPrice(e.target.value);
                    }}
                    style={{ width: 200 }}
                  />
                  <InputGroup.Text id="basic-addon2" style={{ width: 100 }}>KLAY</InputGroup.Text>
                </InputGroup>
              </Form>
              </div>
              <div>
                <label className="detailLb">?????? ??????</label>
                <div style={{display:"flex", justifyContent:"center", border: "1px solid #b5b5b5", textAlign: "cetner", minHeight:"50px", padding: "3%"}}>
                    <div style={{textAlign:"center"}}><span style={{fontSize:"13px", fontWeight:"700"}}>1KLAY</span><span style={{marginLeft:"10%", fontSize: "11px", color:"#252525"}}>(?????????)</span></div>
                    <div style={{textAlign:"center"}}>  = </div>
                    <div><span style={{fontSize:"13px", fontWeight:"700"}}>1,500</span><span style={{marginLeft:"10%", fontSize: "11px", color:"#252525"}}>(???)</span></div>
                </div>
                
              </div>
              <div>
                <label className="detailLb" style={{marginTop:"10%"}}>?????? ??????</label>
                <div className="borderLine"></div>
                  <div>??? {nft.uri.shop_name} </div>
                  <div style={{fontWeight:"600" , fontSize:"15px"}}>{nft.uri.title}</div>
                  <div style={{fontWeight:"540" , fontSize:"13px"}}>{nft.uri.place}</div>
              </div>
              <div>
                <label className="detailLb" style={{marginTop:"10%"}}>???????????????</label>
                <div className="borderLine"></div>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                    <div style={{fontWeight:"bold" , fontSize:"13px"}}>????????? ??????</div>
                    <div style={{fontWeight:"540" , fontSize:"13px", textAlign:"right"}}>0.01 KLAY</div>
                </div>
              </div>
            </div>
          
            <Button
              onClick={() => {
                onClickTransfer(nft.id);
              }}
              variant="primary"
              style={{
                backgroundColor: "#000000",
                borderColor: "#000000",
              }}
            >
              ????????????
            </Button>
          </div>
        ) : null}

        {/* ?????? ????????? */}
        {tab === "MINT" ? (
          <div className="container" style={{ padding: 0, width: "100%" }}>
            <b>????????? ????????? ??????????????????</b><br />
            {mintImageUrl !== "" ? (
              <Card.Img src={mintImageUrl} height={"50%"} />
            ) : null}
            <Form>
              <Form.Group>
                <span>??????ID</span><span>*</span>
                <Form.Control
                  value={mintTokenId}
                  type="text"
                  placeholder="??????ID??? ????????? ?????????"
                  onChange={(e) => {
                    setMintTokenId(e.target.value);
                  }}
                />
                <br/>
                <span>?????????</span><span>*</span>
                <Form.Control
                  value={mintName}
                  type="text"
                  placeholder="???????????? ????????? ?????????"
                  onChange={(e) => {
                    setMintName(e.target.value);
                  }}
                />
                <br />
                <span>??????????????? ??????</span><span>*</span>
                <Form.Control
                  value={mintImageUrl}
                  type="text"
                  placeholder="????????? ??????????????? ????????? ????????? ?????????"
                  onChange={(e) => {
                    setMintImageUrl(e.target.value);
                  }}
                />
                <br />
                <span>????????????</span><span>*</span>
                <ButtonGroup className="mb-2">
                  {categories.map((category, idx) => (
                    <ToggleButton
                      key={idx}
                      id={`category-${idx}`}
                      type="radio"
                      variant='outline-secondary'
                      name="category"
                      value={category.value}
                      checked={mintCategory === category.value}
                      onChange={(e) => setMintCategory(e.currentTarget.value)}
                    >
                      {category.name}
                    </ToggleButton>
                  ))}
                </ButtonGroup>
                <br />
                <span>??????</span><span>*</span>
                <Form.Control
                  value={mintTitle}
                  type="text"
                  placeholder="????????? ????????? ?????????"
                  onChange={(e) => {
                    setMintTitle(e.target.value);
                  }}
                />
                <br />
                <span>????????????</span><span>*</span>
                <DatePicker
                  selected={mintDatetime}
                  onChange={(date) => setMintDatetime(date)}
                  placeholderText="  ????????? ????????? ?????????."
                  className="solid-border"
                />
                <br />
                <br />
                <span>?????? ??????</span><span>*</span>
                <Form.Control
                  value={mintDescription}
                  as="textarea"
                  placeholder="????????? ????????? ????????? ?????????"
                  stype={{ height: '100px' }}
                  onChange={(e) => {
                    setMintDescription(e.target.value);
                  }}
                />
                <br />
                <span>?????? ??????</span><span>*</span>
                <Form.Control
                  value={mintPlace}
                  type="text"
                  placeholder="??????????????? ??????????????????"
                  onChange={(e) => {
                    setMintPlace(e.target.value);
                  }}
                />
              </Form.Group>
              <br />
              <Button
                onClick={() => {
                  onClickMintButton(mintImageUrl, mintName, mintCategory, mintTitle, mintDatetime, mintDescription, mintPlace);
                }}
                variant="primary"
                style={{
                  backgroundColor: "#000000",
                  borderColor: "#000000",
                }}
              >
                ????????????
              </Button>
            </Form>
          </div>
        ) : null}

        {/* ?????? ????????? */}
        {myAddress !== DEFAULT_ADDRESS && tab === "COMPLETE" ? (
          <div style={{textAlign:'center', marginTop:250, paddingRight:10}}>
            {tabBefore == "MARKET" ? 
              <div>
                <img src="drawable-mdpi/frame_84.png" style={{width:75, height:74}}/><br/><br/>
                <p style={{fontSize:"20px", fontWeight:"bold"}}>?????? ??????!</p><br/><br/>
                <p>????????? NFT??? ????????????????????? <br/> ????????? ??? ????????? :)</p>
              </div>
            : tabBefore == "MINT" ?
            <div>
              <img src="drawable-mdpi/frame_85.png" style={{width:75, height:74}}/><br/><br/>
              <p style={{fontSize:"20px", fontWeight:"bold"}}>?????? ??????!</p><br/><br/>
              <p>????????? NFT??? ????????????????????? <br/> ????????? ??? ????????? :)</p>
            </div>
            :
            <div>
              <img src="drawable-mdpi/frame_86.png" style={{width:75, height:74}}/><br/><br/>
              <p style={{fontSize:"20px", fontWeight:"bold"}}>?????? ??????!</p><br/><br/>
              <p>????????? NFT??? ???????????? <br/> ????????? ??? ????????? :)</p>
            </div>
            }
            <Button
              onClick={() => {setTab(tabBefore)}}
              variant={"balance"}
              style={{ backgroundColor: "#000000", color: '#FFFFFF', fontSize: 25, textAlign: "center", width:340 }}
            >??????
            </Button>
          </div>
        ) : null}

        {qrvalue !== "DEFAULT" ? (
          <Container
            style={{
              backgroundColor: "white",
              width: 300,
              height: 300,
              padding: 20,
            }}
          >
            <QRCode value={qrvalue} size={256} style={{ margin: "auto" }} />

            <br />
          </Container>
        ) : null}
      </div>
      <br />
      <br />
  
      <br />
      {/* ?????? */}
      <Modal
        centered
        size="sm"
        show={showModal}
        onHide={() => {
          setShowModal(false);
        }}
      >
        <Modal.Header
          style={{ border: 0, backgroundColor: "#FFFFFF" }}
        >
          <Modal.Title style={{textAlign:"center"}}>{modalProps.title}</Modal.Title>
        </Modal.Header>
        <Modal.Footer
          style={{ border: 0, backgroundColor: "#FFFFFF", margin: "auto" }}
        >
          <Button
            variant="primary"
            onClick={() => {
              modalProps.onConfirm();
              setShowModal(false);
            }}
            style={{ backgroundColor: "#000000", borderColor: "#000000" }}
          >
            ???
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
            }}
            style={{ backgroundColor: "#E1E1E1", borderColor: "#E1E1E1", color: "#000000" }}
          >
            ?????????
          </Button>
        </Modal.Footer>
      </Modal> 

      <Modal
        centered
        size="lg"
        show={showCategory}
        onHide={() => {
          setShowCategory(false);
        }}
      >
        <Modal.Header
          style={{ border: 0, backgroundColor: "#FFFFFF", opacity: 0.8 }}
        >
          <Modal.Title>{categoryModalProps.title}</Modal.Title>
        </Modal.Header>
        <Modal.Footer
          style={{ border: 0, backgroundColor: "#FFFFFF", opacity: 0.8, margin: "auto" }}
        >
          <Nav defaultActiveKey="/home" className="flex-column">
            {(isCategory === true) ?
              <> <Button
                variant="outline-secondary"
                onClick={() => {
                  setShowCategory(false);
                  setClickedCategory(0);
                  setCategoryText("??????");
                }}>
                ?????? {'  '}
                {(clickedCategory === 0) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{ width: "20" }} /> : null}
              </Button>
                <br />
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setShowCategory(false);
                    setClickedCategory(1);
                    setCategoryText("?????????");
                  }}>
                  ????????? {'  '}
                  {(clickedCategory === 1) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{ width: "20" }} /> : null}
                </Button>
                <br />
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setShowCategory(false);
                    setClickedCategory(2);
                    setCategoryText("?????? ?????????");
                  }}>
                  ?????? ????????? {'  '}
                  {(clickedCategory === 2) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{ width: "20" }} /> : null}

                </Button>
                <br />
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setShowCategory(false);
                    setClickedCategory(3);
                    setCategoryText("???????????? ??????");
                  }}>
                  ???????????? ?????? {'  '}
                  {(clickedCategory === 3) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{ width: "20" }} /> : null}
                </Button>
              </> : //null 
              <>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setShowCategory(false);
                    setClickedFilter(1);
                    setFilterText("?????????");
                  }}>
                  ????????? {'  '}
                  {(clickedFilter === 1) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{ width: "20" }} /> : null}
                </Button>
                <br />
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setShowCategory(false);
                    setClickedFilter(2);
                    setFilterText("?????????");
                  }}>
                  ????????? {'  '}
                  {(clickedFilter === 2) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{ width: "20" }} /> : null}

                </Button>
              </>
            }
          </Nav>
        </Modal.Footer>
      </Modal>

      {/* ??? */}
      {myAddress !== DEFAULT_ADDRESS ? (
        <nav
          style={{ backgroundColor: "white", height: 45, width: 390 }}
          className="navbar fixed-bottom navbar-light"
          role="navigation"
        >
          <Nav className="w-100">
            <div className="d-flex flex-row justify-content-around w-100">
              <div
                onClick={() => {
                  setTab("MARKET");
                  fetchMarketNFTs();
                  setQrvalue("DEFAULT")
                }}
                className="row d-flex flex-column justify-content-center align-items-center"
              >
                <div>
                  <FontAwesomeIcon color="#1b1717" size="lg" icon={faHome} style={{ width: 130 }} />
                </div>
              </div>
              <div
                onClick={() => {
                  setTab("MINT");
                  setQrvalue("DEFAULT")
                }}
                className="row d-flex flex-column justify-content-center align-items-center"
              >
                <div>
                  <FontAwesomeIcon color="#1b1717" size="lg" icon={faPlus} style={{ width: 130 }} />
                </div>
              </div>
              <div
                onClick={() => {
                  setTab("WALLET");
                  fetchMyNFTs();
                  setQrvalue("DEFAULT")
                }}
                className="row d-flex flex-column justify-content-center align-items-center"
              >
                <div>
                  <FontAwesomeIcon color="#1b1717" size="lg" icon={faWallet} style={{ width: 130 }} />
                </div>
              </div>
            </div>
          </Nav>
        </nav>
      ) : null}
    </div>
  );
}

export default App;